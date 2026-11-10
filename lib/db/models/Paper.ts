import mongoose, { Schema, Model, models } from "mongoose";
import type { PaperMode, PaperStatus, StoredQuestion } from "@/lib/domain/question";

export type PaperSource = "custom" | "weak_spots" | "daily" | "regenerate";

export interface PaperConfig {
  level: string;
  difficulty: number;
  formats: string[];
  customInstructions: string;
  questionCount: number;
  timeLimitMinutes: number | null;
  focusPoints: string[];
}

export interface PaperDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  schemaVersion: number;
  createdAt: Date;
  mode: PaperMode;
  source: PaperSource;
  config: PaperConfig;
  questions: StoredQuestion[];
  status: PaperStatus;
  startedAt: Date | null;
  deadlineAt: Date | null;
  completedAt: Date | null;
  timeTakenSeconds: number | null;
  score: number | null;
  totalQuestions: number;
}

const TutorTurnSchema = new Schema(
  { role: { type: String, enum: ["user", "assistant"], required: true }, content: { type: String, required: true } },
  { _id: false }
);

const QuestionSchema = new Schema<StoredQuestion>(
  {
    id: { type: Number, required: true },
    section: { type: String, required: true },
    format: { type: String, required: true },
    point: { type: String, default: "" },
    pointKind: { type: String, default: "vocab" },
    passage: { type: String, default: null },
    audioScript: { type: String, default: null },
    prompt: { type: String, required: true },
    options: { type: [String], default: [] },
    answerIndex: { type: Number, default: null },
    answerText: { type: String, default: null },
    acceptedAnswers: { type: [String], default: [] },
    keepScript: { type: Boolean, default: false },
    explanationEn: { type: String, default: "" },
    explanationJp: { type: String, default: "" },
    gloss: { type: String, default: "" },
    userChoice: { type: Number, default: null },
    userText: { type: String, default: null },
    isCorrect: { type: Boolean, default: null },
    answeredAt: { type: Date, default: null },
    guessed: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    tutor: { type: [TutorTurnSchema], default: [] },
  },
  { _id: false }
);

const PaperSchema = new Schema<PaperDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  schemaVersion: { type: Number, default: 2 },
  createdAt: { type: Date, default: () => new Date() },
  mode: { type: String, enum: ["practice", "exam"], default: "practice" },
  source: { type: String, enum: ["custom", "weak_spots", "daily", "regenerate"], default: "custom" },
  config: {
    level: { type: String, required: true },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    formats: { type: [String], default: [] },
    customInstructions: { type: String, default: "" },
    questionCount: { type: Number, required: true },
    timeLimitMinutes: { type: Number, default: null },
    focusPoints: { type: [String], default: [] },
  },
  questions: { type: [QuestionSchema], default: [] },
  status: { type: String, enum: ["generated", "in_progress", "completed"], default: "generated" },
  startedAt: { type: Date, default: null },
  deadlineAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  timeTakenSeconds: { type: Number, default: null },
  score: { type: Number, default: null },
  totalQuestions: { type: Number, required: true },
}, {
  // Mongoose has always named this collection "paper" (it treats the word as
  // uncountable). Pinned so a library upgrade can never point at an empty one.
  collection: "paper",
});

PaperSchema.index({ userId: 1, createdAt: -1 });
PaperSchema.index({ userId: 1, status: 1, completedAt: -1 });

export const Paper: Model<PaperDoc> =
  (models.Paper as Model<PaperDoc>) || mongoose.model<PaperDoc>("Paper", PaperSchema);
