import { z } from "zod";

// What the writer model must return. Kept in two forms: a hand-written JSON
// Schema for Groq's strict structured outputs (every key required,
// additionalProperties false), and a zod schema that re-validates the result.

const nullableString = { type: ["string", "null"] } as const;

export const PAPER_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "format",
          "point",
          "passage",
          "audioScript",
          "prompt",
          "options",
          "answerIndex",
          "answerText",
          "acceptedAnswers",
          "explanationEn",
          "explanationJp",
          "gloss",
        ],
        properties: {
          format: { type: "string" },
          point: { type: "string" },
          passage: nullableString,
          audioScript: nullableString,
          prompt: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answerIndex: { type: ["integer", "null"] },
          answerText: nullableString,
          acceptedAnswers: { type: "array", items: { type: "string" } },
          explanationEn: { type: "string" },
          explanationJp: { type: "string" },
          gloss: { type: "string" },
        },
      },
    },
  },
} as const;

export const generatedQuestionSchema = z.object({
  format: z.string().min(1),
  point: z.string().min(1).max(120),
  passage: z.string().nullable(),
  audioScript: z.string().nullable(),
  prompt: z.string().min(1).max(1200),
  options: z.array(z.string().min(1).max(300)).max(4),
  answerIndex: z.number().int().min(0).max(3).nullable(),
  answerText: z.string().nullable(),
  acceptedAnswers: z.array(z.string()).max(8),
  explanationEn: z.string().min(8).max(1200),
  explanationJp: z.string().min(4).max(1200),
  gloss: z.string().min(1).max(1200),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export const VERIFY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answers"],
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["n", "choice", "sure"],
        properties: {
          n: { type: "integer" },
          choice: { type: "integer" },
          sure: { type: "boolean" },
        },
      },
    },
  },
} as const;

export const verifySchema = z.object({
  answers: z.array(z.object({ n: z.number().int(), choice: z.number().int(), sure: z.boolean() })),
});
