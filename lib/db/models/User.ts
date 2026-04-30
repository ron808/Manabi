import mongoose, { Schema, Model, models } from "mongoose";

export interface UserDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  totalPapers: number;
  totalCorrect: number;
  totalQuestions: number;
}

const UserSchema = new Schema<UserDoc>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
  totalPapers: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
});

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema);
