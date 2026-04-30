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
  question: { options: string[] | null; correctAnswer: string },
  userAnswer: string
): boolean {
  if (question.options && question.options.length > 0) {
    return normalizeMc(userAnswer) === normalizeMc(question.correctAnswer);
  }
  return userAnswer.trim() === String(question.correctAnswer).trim();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { paperId: string } }
) {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  const limited = await applyRateLimit("api", `user:${authed.session.userId}`);
  if (limited) return limited;

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

  await connectDB();
  const paper = await Paper.findOne({
    _id: params.paperId,
    userId: authed.session.userId,
  });
  if (!paper) return jsonError("Paper not found", 404);
  if (paper.status === "completed") {
    return jsonError("Paper already completed", 409);
  }

  const q = paper.questions.find((q) => q.id === questionId);
  if (!q) return jsonError("Question not found", 404);

  const isCorrect = compareAnswer(q, userAnswer);
  q.userAnswer = userAnswer;
  q.isCorrect = isCorrect;
  q.answeredAt = new Date();
  paper.status = "in_progress";
  if (!paper.startedAt) paper.startedAt = new Date();

  await paper.save();

  return NextResponse.json({
    isCorrect,
    correctAnswer: q.correctAnswer,
  });
}
