import mongoose, { Schema, Model, models } from "mongoose";

export interface QuestionDoc {
  id: number;
  format: string;
  questionJp: string;
  passageJp: string | null;
  options: string[] | null;
  correctAnswer: string;
  explanationJp: string;
  explanationEn: string;
  englishGloss: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  answeredAt: Date | null;
}

export interface PaperDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  config: {
    level: string;
    difficulty: number;
    formats: string[];
    customInstructions: string;
    questionCount: number;
    timeLimitMinutes: number | null;
  };
  questions: QuestionDoc[];
  status: "generated" | "in_progress" | "completed";
  startedAt: Date | null;
  completedAt: Date | null;
  timeTakenSeconds: number | null;
  score: number | null;
  totalQuestions: number;
}

const QuestionSchema = new Schema<QuestionDoc>(
  {
    id: { type: Number, required: true },
    format: { type: String, required: true },
    questionJp: { type: String, required: true },
    passageJp: { type: String, default: null },
    options: { type: [String], default: null },
    correctAnswer: { type: String, required: true },
    explanationJp: { type: String, default: "" },
    explanationEn: { type: String, default: "" },
    englishGloss: { type: String, default: "" },
    userAnswer: { type: String, default: null },
    isCorrect: { type: Boolean, default: null },
    answeredAt: { type: Date, default: null },
  },
  { _id: false }
);

const PaperSchema = new Schema<PaperDoc>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  createdAt: { type: Date, default: () => new Date() },
  config: {
    level: { type: String, required: true },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    formats: { type: [String], default: [] },
    customInstructions: { type: String, default: "" },
    questionCount: { type: Number, required: true },
    timeLimitMinutes: { type: Number, default: null },
  },
  questions: { type: [QuestionSchema], default: [] },
  status: {
    type: String,
    enum: ["generated", "in_progress", "completed"],
    default: "generated",
  },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  timeTakenSeconds: { type: Number, default: null },
  score: { type: Number, default: null },
  totalQuestions: { type: Number, required: true },
});

PaperSchema.index({ userId: 1, status: 1 });
PaperSchema.index({ userId: 1, createdAt: -1 });

export const Paper: Model<PaperDoc> =
  (models.Paper as Model<PaperDoc>) ||
  mongoose.model<PaperDoc>("Paper", PaperSchema);
