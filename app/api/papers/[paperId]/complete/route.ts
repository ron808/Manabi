import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Paper } from "@/lib/db/models/Paper";
import { User } from "@/lib/db/models/User";
import { completePaperSchema } from "@/lib/validation/schemas";
import { applyRateLimit, jsonError, requireAuth } from "@/lib/api/helpers";

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
  const parsed = completePaperSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { timeTakenSeconds } = parsed.data;

  const [limited] = await Promise.all([
    applyRateLimit("api", `user:${authed.session.userId}`),
    connectDB(),
  ]);
  if (limited) return limited;

  // Read just the answer flags — not full questions, passages, explanations.
  const lite = await Paper.findOne(
    { _id: params.paperId, userId: authed.session.userId },
    {
      status: 1,
      totalQuestions: 1,
      "questions.isCorrect": 1,
      "questions.userAnswer": 1,
    }
  ).lean();

  if (!lite) return jsonError("Paper not found", 404);
  if (lite.status === "completed") {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  const score = lite.questions.filter((q) => q.isCorrect === true).length;
  const answered = lite.questions.filter((q) => q.userAnswer != null).length;

  // Run the two writes in parallel — they touch different collections.
  await Promise.all([
    Paper.updateOne(
      { _id: params.paperId, userId: authed.session.userId, status: { $ne: "completed" } },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          timeTakenSeconds,
          score,
        },
      }
    ),
    User.updateOne(
      { _id: authed.session.userId },
      {
        $inc: {
          totalPapers: 1,
          totalCorrect: score,
          totalQuestions: answered,
        },
      }
    ),
  ]);

  return NextResponse.json({
    ok: true,
    score,
    totalQuestions: lite.totalQuestions,
    answered,
  });
}
