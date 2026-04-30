import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Paper } from "@/lib/db/models/Paper";
import { applyRateLimit, requireAuth } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  const limited = await applyRateLimit("api", `user:${authed.session.userId}`);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = Math.max(0, Number(searchParams.get("skip") ?? 0));

  await connectDB();
  const [papers, total] = await Promise.all([
    Paper.find({ userId: authed.session.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "_id config status createdAt completedAt timeTakenSeconds score totalQuestions"
      )
      .lean(),
    Paper.countDocuments({ userId: authed.session.userId }),
  ]);

  return NextResponse.json({
    papers: papers.map((p) => ({
      ...p,
      _id: String(p._id),
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      completedAt:
        p.completedAt instanceof Date ? p.completedAt.toISOString() : p.completedAt,
    })),
    total,
    limit,
    skip,
  });
}
