import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Paper } from "@/lib/db/models/Paper";
import { generatePaperSchema } from "@/lib/validation/schemas";
import { generatePaper } from "@/lib/ai/groq";
import { applyRateLimit, jsonError, requireAuth } from "@/lib/api/helpers";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  const limited = await applyRateLimit("generate", `user:${authed.session.userId}`);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = generatePaperSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const config = parsed.data;

  let generated;
  try {
    generated = await generatePaper(config);
  } catch (err) {
    console.error("[manabi] groq error", err);
    return jsonError(
      "Failed to generate paper. Please try again.",
      502
    );
  }

  await connectDB();
  const paper = await Paper.create({
    userId: authed.session.userId,
    config,
    questions: generated.questions.map((q) => ({
      ...q,
      userAnswer: null,
      isCorrect: null,
      answeredAt: null,
    })),
    status: "generated",
    totalQuestions: generated.questions.length,
  });

  return NextResponse.json({ paperId: paper._id.toString() }, { status: 201 });
}
