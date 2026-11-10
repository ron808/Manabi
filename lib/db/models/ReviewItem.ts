import mongoose, { Schema, Model, models } from "mongoose";
import type { StoredQuestion } from "@/lib/domain/question";
import type { CardState } from "@/lib/domain/srs";

export interface ReviewItemDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  paperId: mongoose.Types.ObjectId;
  questionId: number;
  level: string;
  /** Frozen copy of the question, with the learner's original wrong answer. */
  question: StoredQuestion;
  pointKey: string | null;
  card: CardState;
  archived: boolean;
  createdAt: Date;
  lastResult: "again" | "hard" | "good" | "easy" | null;
}

const CardSchema = new Schema<CardState>(
  {
    due: { type: Date, required: true },
    stability: { type: Number, required: true },
    difficulty: { type: Number, required: true },
    elapsedDays: { type: Number, default: 0 },
    scheduledDays: { type: Number, default: 0 },
    learningSteps: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    state: { type: Number, default: 0 },
    lastReview: { type: Date, default: null },
  },
  { _id: false }
);

const ReviewItemSchema = new Schema<ReviewItemDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  paperId: { type: Schema.Types.ObjectId, ref: "Paper", required: true },
  questionId: { type: Number, required: true },
  level: { type: String, default: "" },
  question: { type: Schema.Types.Mixed, required: true },
  pointKey: { type: String, default: null },
  card: { type: CardSchema, required: true },
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date() },
  lastResult: { type: String, default: null },
}, { collection: "reviewitems" });

ReviewItemSchema.index({ userId: 1, paperId: 1, questionId: 1 }, { unique: true });
ReviewItemSchema.index({ userId: 1, archived: 1, "card.due": 1 });
ReviewItemSchema.index({ userId: 1, createdAt: -1 });

export const ReviewItem: Model<ReviewItemDoc> =
  (models.ReviewItem as Model<ReviewItemDoc>) ||
  mongoose.model<ReviewItemDoc>("ReviewItem", ReviewItemSchema);
