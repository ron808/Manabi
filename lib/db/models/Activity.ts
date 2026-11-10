import mongoose, { Schema, Model, models } from "mongoose";

/** One row per learner per calendar day (in their timezone). */
export interface ActivityDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  day: string; // YYYY-MM-DD
  answered: number;
  correct: number;
  reviews: number;
  papers: number;
}

const ActivitySchema = new Schema<ActivityDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  day: { type: String, required: true },
  answered: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  papers: { type: Number, default: 0 },
}, { collection: "activities" });

ActivitySchema.index({ userId: 1, day: -1 }, { unique: true });

export const Activity: Model<ActivityDoc> =
  (models.Activity as Model<ActivityDoc>) || mongoose.model<ActivityDoc>("Activity", ActivitySchema);
