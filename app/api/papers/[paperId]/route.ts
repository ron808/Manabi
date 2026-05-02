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

  if (!mongoose.Types.ObjectId.isValid(params.paperId)) {
    return jsonError("Invalid paper id", 400);
  }

  // Rate limit + connectDB in parallel.
  const [limited] = await Promise.all([
    applyRateLimit("api", `user:${authed.session.userId}`),
    connectDB(),
  ]);
  if (limited) return limited;

  // Single round-trip: atomically flip status from "generated" -> "in_progress"
  // (and stamp startedAt) using an aggregation pipeline update, returning the
  // post-update doc. The previous code did findOne + conditional updateOne —
  // that's 2 sequential Atlas hops on every page load.
  const paper = await Paper.findOneAndUpdate(
    { _id: params.paperId, userId: authed.session.userId },
    [
      {
        $set: {
          status: {
            $cond: [
              { $eq: ["$status", "generated"] },
              "in_progress",
              "$status",
            ],
          },
          startedAt: {
            $cond: [
              { $eq: ["$status", "generated"] },
              "$$NOW",
              "$startedAt",
            ],
          },
        },
      },
    ],
    { new: true, lean: true, updatePipeline: true }
  );

  if (!paper) return jsonError("Paper not found", 404);

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
