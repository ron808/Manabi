import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Paper } from "@/lib/db/models/Paper";
import { applyRateLimit, jsonError, requireAuth } from "@/lib/api/helpers";
import { clearMistakesSchema } from "@/lib/validation/schemas";

export async function GET() {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  const limited = await applyRateLimit("api", `user:${authed.session.userId}`);
  if (limited) return limited;

  await connectDB();
  const papers = await Paper.find({
    userId: authed.session.userId,
    status: "completed",
  })
    .sort({ completedAt: -1 })
    .select("_id config completedAt questions")
    .lean();

  const mistakes = [] as Array<{
    paperId: string;
    paperLevel: string;
    paperFormat: string;
    completedAt: string | null;
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
  }>;

  for (const paper of papers) {
    for (const q of paper.questions) {
      if (q.isCorrect === false) {
        mistakes.push({
          paperId: String(paper._id),
          paperLevel: paper.config.level,
          paperFormat: q.format,
          completedAt:
            paper.completedAt instanceof Date
              ? paper.completedAt.toISOString()
              : (paper.completedAt as string | null),
          question: {
            id: q.id,
            format: q.format,
            questionJp: q.questionJp,
            passageJp: q.passageJp,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: q.userAnswer,
            explanationJp: q.explanationJp,
            explanationEn: q.explanationEn,
            englishGloss: q.englishGloss,
          },
        });
      }
    }
  }

  return NextResponse.json({ mistakes, total: mistakes.length });
}

export async function DELETE(req: NextRequest) {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  const limited = await applyRateLimit("api", `user:${authed.session.userId}`);
  if (limited) return limited;

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

  await connectDB();
  // We do not destroy paper history. We mark wrong answers as "cleared" by
  // setting isCorrect to null on completed papers' wrong questions.
  const result = await Paper.updateMany(
    { userId: authed.session.userId, status: "completed" },
    { $set: { "questions.$[wrong].isCorrect": null } },
    { arrayFilters: [{ "wrong.isCorrect": false }] }
  );

  return NextResponse.json({ ok: true, modified: result.modifiedCount });
}
