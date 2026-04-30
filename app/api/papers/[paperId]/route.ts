import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Paper } from "@/lib/db/models/Paper";
import { applyRateLimit, jsonError, requireAuth } from "@/lib/api/helpers";

export async function GET(
  _req: Request,
  { params }: { params: { paperId: string } }
) {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  const limited = await applyRateLimit("api", `user:${authed.session.userId}`);
  if (limited) return limited;

  if (!mongoose.Types.ObjectId.isValid(params.paperId)) {
    return jsonError("Invalid paper id", 400);
  }

  await connectDB();
  const paper = await Paper.findOne({
    _id: params.paperId,
    userId: authed.session.userId,
  }).lean();

  if (!paper) return jsonError("Paper not found", 404);

  // Mark "in_progress" the first time the test is opened.
  if (paper.status === "generated") {
    await Paper.updateOne(
      { _id: paper._id, userId: authed.session.userId },
      { $set: { status: "in_progress", startedAt: new Date() } }
    );
    paper.status = "in_progress";
    paper.startedAt = new Date();
  }

  return NextResponse.json({
    paper: {
      ...paper,
      _id: String(paper._id),
      userId: String(paper.userId),
      createdAt:
        paper.createdAt instanceof Date ? paper.createdAt.toISOString() : paper.createdAt,
      startedAt:
        paper.startedAt instanceof Date ? paper.startedAt.toISOString() : paper.startedAt,
      completedAt:
        paper.completedAt instanceof Date
          ? paper.completedAt.toISOString()
          : paper.completedAt,
    },
  });
}
