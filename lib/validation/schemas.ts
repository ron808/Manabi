import { z } from "zod";
import { FORMAT_BY_ID, LEVELS } from "@/lib/domain/jlpt";

export const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30] as const;

const password = z.string().min(8, "Use at least 8 characters").max(200);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
    password,
    timezone: z.string().max(64).nullish(),
  })
  .strict();

const level = z.enum(LEVELS);
const mode = z.enum(["practice", "exam"]);
const formatId = z.string().refine((f) => !!FORMAT_BY_ID[f], "Unknown question type");

export const generateSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("custom"),
      level,
      difficulty: z.number().int().min(1).max(5),
      formats: z.array(formatId).min(1).max(20),
      questionCount: z.number().int().refine((n) => (QUESTION_COUNTS as readonly number[]).includes(n), {
        message: "Choose 5, 10, 15, 20, 25 or 30 questions",
      }),
      timeLimitMinutes: z.number().int().min(1).max(180).nullable(),
      customInstructions: z.string().trim().max(500).default(""),
      mode,
    })
    .strict(),
  z
    .object({
      kind: z.literal("weak_spots"),
      level: level.optional(),
      questionCount: z.number().int().min(5).max(20).optional(),
      mode: mode.optional(),
    })
    .strict(),
  z.object({ kind: z.literal("daily") }).strict(),
  z.object({ kind: z.literal("regenerate"), fromPaperId: z.string().min(1).max(40) }).strict(),
]);
export type GenerateRequest = z.infer<typeof generateSchema>;

export const answerSchema = z
  .object({
    questionId: z.number().int().min(1).max(1000),
    choice: z.number().int().min(0).max(3).optional(),
    text: z.string().trim().min(1).max(200).optional(),
    guessed: z.boolean().optional(),
  })
  .strict()
  .refine((b) => (b.choice === undefined) !== (b.text === undefined), {
    message: "Send either a choice or a typed answer",
  });

export const reviewAnswerSchema = z
  .object({
    choice: z.number().int().min(0).max(3).optional(),
    text: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine((b) => (b.choice === undefined) !== (b.text === undefined), {
    message: "Send either a choice or a typed answer",
  });

export const reviewGradeSchema = z.object({ rating: z.enum(["hard", "good", "easy"]) }).strict();

export const flagSchema = z.object({ flagged: z.boolean() }).strict();
export const archiveSchema = z.object({ archived: z.boolean() }).strict();

export const tutorSchema = z.object({ message: z.string().trim().min(1).max(500) }).strict();

export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    settings: z
      .object({
        targetLevel: level.nullable().optional(),
        examDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
          .nullable()
          .optional(),
        dailyGoal: z.number().int().min(5).max(300).optional(),
        furigana: z.boolean().optional(),
        timezone: z.string().max(64).nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const passwordSchema = z.object({ current: z.string().min(1).max(200), next: password }).strict();
export const deleteAccountSchema = z.object({ password: z.string().min(1).max(200) }).strict();
