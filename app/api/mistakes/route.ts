import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Paper } from "@/lib/db/models/Paper";
import { applyRateLimit, jsonError, requireAuth } from "@/lib/api/helpers";
import { clearMistakesSchema } from "@/lib/validation/schemas";
import mongoose from "mongoose";

export async function GET() {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  const [limited] = await Promise.all([
    applyRateLimit("api", `user:${authed.session.userId}`),
    connectDB(),
  ]);
  if (limited) return limited;

  // Server-side aggregation: unwind the questions array, keep only wrong
  // answers, project the exact shape we want. Previously we loaded every
  // completed paper with all questions then filtered in JS — for a user with
  // 50 papers x 15 questions, that's 750 docs over the wire.
  const userId = new mongoose.Types.ObjectId(authed.session.userId);
  const rows = await Paper.aggregate<{
    paperId: mongoose.Types.ObjectId;
    paperLevel: string;
    completedAt: Date | null;
    question: {
      id: number;
      format: string;
      questionJp: string;
      passageJp: string | null;
      options: string[] | null;
      correctAnswer: string;
      userAnswer: string | null;
      explanationJp: string;
      explanationEn: string;
      englishGloss: string;
    };
  }>([
    { $match: { userId, status: "completed" } },
    { $sort: { completedAt: -1 } },
    {
      $project: {
        _id: 1,
        completedAt: 1,
        "config.level": 1,
        questions: 1,
      },
    },
    { $unwind: "$questions" },
    { $match: { "questions.isCorrect": false } },
    {
      $project: {
        _id: 0,
        paperId: "$_id",
        paperLevel: "$config.level",
        completedAt: 1,
        question: {
          id: "$questions.id",
          format: "$questions.format",
          questionJp: "$questions.questionJp",
          passageJp: "$questions.passageJp",
          options: "$questions.options",
          correctAnswer: "$questions.correctAnswer",
          userAnswer: "$questions.userAnswer",
          explanationJp: "$questions.explanationJp",
          explanationEn: "$questions.explanationEn",
          englishGloss: "$questions.englishGloss",
        },
      },
    },
  ]);

  const mistakes = rows.map((r) => ({
    paperId: String(r.paperId),
    paperLevel: r.paperLevel,
    paperFormat: r.question.format,
    completedAt:
      r.completedAt instanceof Date ? r.completedAt.toISOString() : r.completedAt,
    question: r.question,
  }));

  return NextResponse.json({ mistakes, total: mistakes.length });
}

export async function DELETE(req: NextRequest) {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = clearMistakesSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Confirmation required", 400);
  }

  const [limited] = await Promise.all([
    applyRateLimit("api", `user:${authed.session.userId}`),
    connectDB(),
  ]);
  if (limited) return limited;

  // We do not destroy paper history. We mark wrong answers as "cleared" by
  // setting isCorrect to null on completed papers' wrong questions.
  const result = await Paper.updateMany(
    { userId: authed.session.userId, status: "completed" },
    { $set: { "questions.$[wrong].isCorrect": null } },
    { arrayFilters: [{ "wrong.isCorrect": false }] }
  );

  return NextResponse.json({ ok: true, modified: result.modifiedCount });
}
