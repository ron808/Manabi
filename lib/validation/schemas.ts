import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(200),
    password: z.string().min(8).max(200),
  })
  .strict();

export const ALLOWED_LEVELS = [
  "Beginner",
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
  "Custom",
] as const;

export const ALLOWED_QUESTION_COUNTS = [5, 10, 15, 20, 25, 30] as const;

export const generatePaperSchema = z
  .object({
    level: z.enum(ALLOWED_LEVELS),
    difficulty: z.number().int().min(1).max(5),
    formats: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
    customInstructions: z.string().trim().max(500).default(""),
    questionCount: z.number().int().refine(
      (n) => (ALLOWED_QUESTION_COUNTS as readonly number[]).includes(n),
      { message: "questionCount must be one of 5,10,15,20,25,30" }
    ),
    timeLimitMinutes: z.number().int().min(1).max(180).nullable(),
  })
  .strict()
  .refine(
    (data) =>
      data.level !== "Custom" || data.customInstructions.trim().length > 0,
    {
      message: "customInstructions required when level is Custom",
      path: ["customInstructions"],
    }
  );

export const submitAnswerSchema = z
  .object({
    questionId: z.number().int().min(1),
    userAnswer: z.string().trim().max(500),
  })
  .strict();

export const completePaperSchema = z
  .object({
    timeTakenSeconds: z.number().int().min(0).max(60 * 60 * 24),
  })
  .strict();

export const clearMistakesSchema = z
  .object({
    confirm: z.literal(true),
  })
  .strict();
