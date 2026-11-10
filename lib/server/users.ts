import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ApiError } from "@/lib/api/errors";
import { Activity } from "@/lib/db/models/Activity";
import { Mastery } from "@/lib/db/models/Mastery";
import { Paper } from "@/lib/db/models/Paper";
import { ReviewItem } from "@/lib/db/models/ReviewItem";
import { User, type UserSettings } from "@/lib/db/models/User";
import { isValidTimeZone } from "@/lib/domain/dates";
import type { CurrentUser } from "./session";

const BCRYPT_COST = 12;

export async function registerUser(input: { name: string; email: string; password: string; timezone?: string | null }) {
  const [existing, passwordHash] = await Promise.all([
    User.findOne({ email: input.email }).select("_id").lean(),
    bcrypt.hash(input.password, BCRYPT_COST),
  ]);
  if (existing) throw new ApiError("conflict", "An account with this email already exists. Try signing in.");
  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      settings: { timezone: isValidTimeZone(input.timezone) ? input.timezone : null },
    });
    return { id: user._id.toString() };
  } catch (err) {
    // Two sign-ups racing for the same email hit the unique index.
    if ((err as { code?: number }).code === 11000) {
      throw new ApiError("conflict", "An account with this email already exists. Try signing in.");
    }
    throw err;
  }
}

export async function updateProfile(
  user: CurrentUser,
  patch: { name?: string; settings?: Partial<UserSettings> }
): Promise<CurrentUser> {
  const set: Record<string, unknown> = {};
  if (patch.name) set.name = patch.name;
  for (const [k, v] of Object.entries(patch.settings ?? {})) {
    if (v !== undefined) set[`settings.${k}`] = v;
  }
  if (!Object.keys(set).length) return user;
  const updated = await User.findByIdAndUpdate(user.id, { $set: set }, { returnDocument: "after" })
    .select("name email settings")
    .lean();
  if (!updated) throw new ApiError("unauthorized", "Your account no longer exists.");
  return { id: user.id, email: updated.email, name: updated.name, settings: { ...user.settings, ...updated.settings } };
}

async function checkPassword(userId: string, password: string) {
  const doc = await User.findById(userId).select("passwordHash").lean();
  if (!doc || !(await bcrypt.compare(password, doc.passwordHash))) {
    throw new ApiError("forbidden", "That password isn't right.");
  }
}

/** Changes the password and signs out every other session (token version bump). */
export async function changePassword(user: CurrentUser, current: string, next: string) {
  await checkPassword(user.id, current);
  const passwordHash = await bcrypt.hash(next, BCRYPT_COST);
  await User.updateOne({ _id: user.id }, { $set: { passwordHash }, $inc: { tokenVersion: 1 } });
}

export async function deleteAccount(user: CurrentUser, password: string) {
  await checkPassword(user.id, password);
  const userId = new mongoose.Types.ObjectId(user.id);
  await Promise.all([
    Paper.deleteMany({ userId }),
    ReviewItem.deleteMany({ userId }),
    Activity.deleteMany({ userId }),
    Mastery.deleteMany({ userId }),
  ]);
  await User.deleteOne({ _id: userId });
}

export async function exportData(user: CurrentUser) {
  const userId = new mongoose.Types.ObjectId(user.id);
  const [profile, papers, reviews, activity, mastery] = await Promise.all([
    User.findById(userId).select("-passwordHash -tokenVersion -__v").lean(),
    Paper.find({ userId }).select("-__v -userId").sort({ createdAt: 1 }).lean(),
    ReviewItem.find({ userId }).select("-__v -userId").sort({ createdAt: 1 }).lean(),
    Activity.find({ userId }).select("-__v -userId -_id").sort({ day: 1 }).lean(),
    Mastery.find({ userId }).select("-__v -userId -_id").sort({ key: 1 }).lean(),
  ]);
  return { exportedAt: new Date().toISOString(), profile, papers, reviews, activity, mastery };
}
