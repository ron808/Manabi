import { cache } from "react";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/mongoose";
import { User, type UserSettings } from "@/lib/db/models/User";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  settings: UserSettings;
}

const DEFAULT_SETTINGS: UserSettings = {
  targetLevel: null,
  examDate: null,
  dailyGoal: 20,
  furigana: true,
  timezone: null,
};

/**
 * The signed-in user, verified against the database: the account must still
 * exist and the session must not predate a password change. Deduped per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const user = await User.findById(id).select("name email settings tokenVersion").lean();
  if (!user) return null;
  if ((user.tokenVersion ?? 0) !== (session.user.tokenVersion ?? 0)) return null;
  return {
    id,
    email: user.email,
    name: user.name,
    settings: { ...DEFAULT_SETTINGS, ...(user.settings ?? {}) },
  };
});

/** For server components: the user, or a redirect to log in. */
export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}
