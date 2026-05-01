import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { applyRateLimit, requireAuth } from "@/lib/api/helpers";

export async function GET() {
  const authed = await requireAuth();
  if (!authed.ok) return authed.response;

  const [limited] = await Promise.all([
    applyRateLimit("api", `user:${authed.session.userId}`),
    connectDB(),
  ]);
  if (limited) return limited;

  const user = await User.findById(authed.session.userId)
    .select("name email totalPapers totalCorrect totalQuestions createdAt")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    name: user.name,
    email: user.email,
    totalPapers: user.totalPapers,
    totalCorrect: user.totalCorrect,
    totalQuestions: user.totalQuestions,
    accuracy:
      user.totalQuestions > 0
        ? Math.round((user.totalCorrect / user.totalQuestions) * 100)
        : 0,
    memberSince:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt,
  });
}
