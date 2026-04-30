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
  const parsed = completePaperSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { timeTakenSeconds } = parsed.data;

  await connectDB();
  const paper = await Paper.findOne({
    _id: params.paperId,
    userId: authed.session.userId,
  });
  if (!paper) return jsonError("Paper not found", 404);

  if (paper.status === "completed") {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  const score = paper.questions.filter((q) => q.isCorrect === true).length;
  const answered = paper.questions.filter((q) => q.userAnswer != null).length;

  paper.status = "completed";
  paper.completedAt = new Date();
  paper.timeTakenSeconds = timeTakenSeconds;
  paper.score = score;
  await paper.save();

  await User.updateOne(
    { _id: authed.session.userId },
    {
      $inc: {
        totalPapers: 1,
        totalCorrect: score,
        totalQuestions: answered,
      },
    }
  );

  return NextResponse.json({
    ok: true,
    score,
    totalQuestions: paper.totalQuestions,
    answered,
  });
}
