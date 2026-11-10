import mongoose, { Schema, Model, models } from "mongoose";

/** How well a learner knows one learning point (a grammar pattern, word, kanji…). */
export interface MasteryDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  key: string;
  label: string;
  kind: string;
  level: string;
  seen: number;
  correct: number;
  /** Last five results, newest last: 1 = right, 0 = wrong. */
  recent: number[];
  lastSeenAt: Date;
}

const MasterySchema = new Schema<MasteryDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  key: { type: String, required: true },
  label: { type: String, required: true },
  kind: { type: String, required: true },
  level: { type: String, default: "" },
  seen: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  recent: { type: [Number], default: [] },
  lastSeenAt: { type: Date, default: () => new Date() },
}, { collection: "masteries" });

MasterySchema.index({ userId: 1, key: 1 }, { unique: true });
MasterySchema.index({ userId: 1, lastSeenAt: -1 });

export const Mastery: Model<MasteryDoc> =
  (models.Mastery as Model<MasteryDoc>) || mongoose.model<MasteryDoc>("Mastery", MasterySchema);
