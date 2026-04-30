export type Level = "Beginner" | "N5" | "N4" | "N3" | "N2" | "N1" | "Custom";

export type QuestionFormat =
  | "Vocabulary"
  | "Kanji reading"
  | "Particle fill-in-the-blank"
  | "Grammar"
  | "Reading comprehension"
  | "Listening comprehension"
  | string;

export interface PaperConfig {
  level: Level;
  difficulty: number;
  formats: string[];
  customInstructions: string;
  questionCount: number;
  timeLimitMinutes: number | null;
}

export interface Question {
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
  answeredAt: Date | string | null;
}

export interface PaperSummary {
  _id: string;
  config: PaperConfig;
  status: "generated" | "in_progress" | "completed";
  createdAt: string;
  completedAt: string | null;
  score: number | null;
  totalQuestions: number;
  timeTakenSeconds: number | null;
}

export interface PaperFull extends PaperSummary {
  questions: Question[];
  startedAt: string | null;
}

export interface UserStats {
  totalPapers: number;
  totalCorrect: number;
  totalQuestions: number;
}

export const ALL_FORMATS: string[] = [
  "Vocabulary",
  "Kanji reading",
  "Particle fill-in-the-blank",
  "Grammar",
  "Reading comprehension",
  "Listening comprehension",
];

export const ALLOWED_LEVELS: Level[] = [
  "Beginner",
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
  "Custom",
];

export const ALLOWED_QUESTION_COUNTS = [5, 10, 15, 20, 25, 30] as const;
