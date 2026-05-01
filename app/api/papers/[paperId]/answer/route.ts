import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Paper } from "@/lib/db/models/Paper";
import { submitAnswerSchema } from "@/lib/validation/schemas";
import { applyRateLimit, jsonError, requireAuth } from "@/lib/api/helpers";

function normalizeMc(s: string): string {
  return s.trim().toUpperCase().slice(0, 1);
}

function compareAnswer(
  options: string[] | null | undefined,
  correctAnswer: string,
  userAnswer: string
): boolean {
  if (options && options.length > 0) {
    return normalizeMc(userAnswer) === normalizeMc(correctAnswer);
  }
  return userAnswer.trim() === String(correctAnswer).trim();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { paperId: string } }
) {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  if (!mongoose.Types.ObjectId.isValid(params.paperId)) {
    return jsonError("Invalid paper id", 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = submitAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { questionId, userAnswer } = parsed.data;

  // Run rate limit + DB connect in parallel — they're independent network
  // calls (Upstash + Atlas) and waiting them sequentially adds 50–200ms.
  const [limited] = await Promise.all([
    applyRateLimit("api", `user:${authed.session.userId}`),
    connectDB(),
  ]);
  if (limited) return limited;

  // Fetch ONLY the matching question (positional projection) — not the whole
  // paper. Saves loading 10–20 question objects (each with passage + AI text)
  // just to grade one click.
  const lite = await Paper.findOne(
    {
      _id: params.paperId,
      userId: authed.session.userId,
      "questions.id": questionId,
    },
    { "questions.$": 1, status: 1, startedAt: 1 }
  ).lean();

  if (!lite) return jsonError("Paper or question not found", 404);
  if (lite.status === "completed") {
    return jsonError("Paper already completed", 409);
  }

  const q = lite.questions?.[0];
  if (!q) return jsonError("Question not found", 404);

  const isCorrect = compareAnswer(q.options, q.correctAnswer, userAnswer);
  const now = new Date();

  const set: Record<string, unknown> = {
    "questions.$.userAnswer": userAnswer,
    "questions.$.isCorrect": isCorrect,
    "questions.$.answeredAt": now,
    status: "in_progress",
  };
  if (!lite.startedAt) set.startedAt = now;

  // Targeted positional update — writes ~80 bytes instead of rewriting the
  // entire document.
  await Paper.updateOne(
    {
      _id: params.paperId,
      userId: authed.session.userId,
      "questions.id": questionId,
    },
    { $set: set }
  );

  return NextResponse.json({
    isCorrect,
    correctAnswer: q.correctAnswer,
  });
}
