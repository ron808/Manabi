import mongoose, { Schema, Model, models } from "mongoose";

export interface UserSettings {
  targetLevel: string | null;
  examDate: string | null; // YYYY-MM-DD
  dailyGoal: number;
  furigana: boolean;
  timezone: string | null;
}

export interface UserDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  /** Bumped on password change; sessions carrying an older value are rejected. */
  tokenVersion: number;
  settings: UserSettings;
  totalPapers: number;
  totalCorrect: number;
  totalQuestions: number;
  reviewBackfilledAt: Date | null;
}

const UserSchema = new Schema<UserDoc>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
  tokenVersion: { type: Number, default: 0 },
  settings: {
    targetLevel: { type: String, default: null },
    examDate: { type: String, default: null },
    dailyGoal: { type: Number, default: 20 },
    furigana: { type: Boolean, default: true },
    timezone: { type: String, default: null },
  },
  totalPapers: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  reviewBackfilledAt: { type: Date, default: null },
}, { collection: "users" });

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema);
