import Groq from "groq-sdk";
import { z } from "zod";
import type { PaperConfig } from "@/lib/types";

let _client: Groq | null = null;
function client() {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
    _client = new Groq({ apiKey });
  }
  return _client;
}

export const generatedQuestionSchema = z.object({
  id: z.number().int().positive(),
  format: z.string().min(1),
  questionJp: z.string().min(1),
  passageJp: z.string().nullable(),
  options: z.array(z.string().min(1)).length(4).nullable(),
  correctAnswer: z.string().min(1),
  explanationJp: z.string().min(2),
  explanationEn: z.string().min(2),
  englishGloss: z.string().min(1),
});

export const generatedPaperSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedPaper = z.infer<typeof generatedPaperSchema>;

const MODEL_PRIMARY = "openai/gpt-oss-120b";
const MODEL_FALLBACK = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a JLPT exam designer. You write real Japanese (kanji/hiragana/katakana) at the requested level. You output ONLY the structured plain-text format requested. No markdown, no code fences, no preamble.`;

function buildUserPrompt(config: PaperConfig): string {
  return `Write ${config.questionCount} JLPT-style questions.

Level: ${config.level}, Difficulty: ${config.difficulty}/5
Formats (distribute evenly): ${config.formats.join(", ")}
Custom: ${config.customInstructions || "none"}

Output format — every question is one block. Use these EXACT labels. Each value is on a single line.

[Q1]
FORMAT: <one of the formats>
PASSAGE: <Japanese passage on one line, or NONE>
QUESTION_JP: <question in Japanese, single line, MUST include real kanji/hiragana/katakana>
OPT_A: <option in Japanese, or NONE if not multiple choice>
OPT_B: <option in Japanese, or NONE>
OPT_C: <option in Japanese, or NONE>
OPT_D: <option in Japanese, or NONE>
ANSWER: <A | B | C | D for MC, or the exact Japanese answer for fill-in — NEVER blank>
EXPLANATION_JP: <one Japanese sentence explaining why, MUST be substantive — never just "です。">
EXPLANATION_EN: <one English sentence explaining the same>
GLOSS: <English translation of the question + key vocabulary>

Hard rules:
- Every Japanese field must contain real Japanese characters.
- ANSWER must NEVER be empty.
- EXPLANATION_JP and EXPLANATION_EN must each be a real, complete sentence.
- For multiple-choice formats (Vocabulary, Kanji reading, Particle, Grammar): fill all four OPT_A..OPT_D with real Japanese options. The four options MUST all be different from each other — never duplicate option text. ANSWER is one of A/B/C/D.
- For Reading comprehension and Listening comprehension: PASSAGE is a short Japanese passage; OPT_A..D are 4 distinct options; ANSWER is A/B/C/D.
- Number blocks [Q1] through [Q${config.questionCount}]. No closing tag needed.
- After [Q${config.questionCount}], stop. No commentary.`;
}

// Split into blocks by [Q<n>] markers — closing tags are optional.
function parseStructuredText(text: string): GeneratedQuestion[] {
  const markerRe = /\[Q(\d+)\]/g;
  const markers: { id: number; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(text)) !== null) {
    markers.push({ id: parseInt(m[1], 10), start: m.index, end: m.index + m[0].length });
  }
  if (markers.length === 0) return [];

  const out: GeneratedQuestion[] = [];
  for (let i = 0; i < markers.length; i++) {
    const blockStart = markers[i].end;
    const blockEnd = i + 1 < markers.length ? markers[i + 1].start : text.length;
    const body = text
      .slice(blockStart, blockEnd)
      .replace(/\[\/Q\d+\]/g, "")
      .trim();

    const fields: Record<string, string> = {};
    for (const line of body.split(/\r?\n/)) {
      const lm = line.match(/^\s*([A-Z_]+)\s*:\s*(.*)$/);
      if (lm) fields[lm[1]] = lm[2].trim();
    }

    const isNone = (v: string | undefined) =>
      !v || v === "NONE" || v === "null" || v === "None" || v === "-";

    const rawOptA = fields.OPT_A;
    const rawOptB = fields.OPT_B;
    const rawOptC = fields.OPT_C;
    const rawOptD = fields.OPT_D;
    const rawValues = [rawOptA, rawOptB, rawOptC, rawOptD];
    const allOptionsPresent = rawValues.every((o) => o && !isNone(o));

    let options: string[] | null = null;
    let correctAnswer = fields.ANSWER ?? "";

    if (allOptionsPresent) {
      // Reject obviously broken sets where the model repeated the same
      // option text in multiple slots — those questions are unsolvable.
      const uniq = new Set(rawValues.map((v) => v!.trim()));
      if (uniq.size < 4) {
        // Skip this question; validation will catch it as missing.
        continue;
      }

      // Map original A/B/C/D → text, then randomly permute and rebuild
      // labels. This guarantees correct answers are evenly distributed
      // even if the model writes "A" for every question.
      const original: Record<string, string> = {
        A: rawOptA!,
        B: rawOptB!,
        C: rawOptC!,
        D: rawOptD!,
      };
      const letters = ["A", "B", "C", "D"];
      // Fisher–Yates shuffle the letters; the i-th shuffled letter says
      // which original option ends up in slot i.
      const order = [...letters];
      for (let k = order.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [order[k], order[j]] = [order[j], order[k]];
      }
      options = order.map((srcLetter, idx) => `${letters[idx]}: ${original[srcLetter]}`);

      const ansLetter = correctAnswer.trim().charAt(0).toUpperCase();
      const newIndex = order.indexOf(ansLetter);
      if (newIndex >= 0) correctAnswer = letters[newIndex];
    }

    out.push({
      id: markers[i].id,
      format: fields.FORMAT ?? "",
      questionJp: fields.QUESTION_JP ?? "",
      passageJp: isNone(fields.PASSAGE) ? null : fields.PASSAGE,
      options,
      correctAnswer,
      explanationJp: fields.EXPLANATION_JP ?? "",
      explanationEn: fields.EXPLANATION_EN ?? "",
      englishGloss: fields.GLOSS ?? "",
    });
  }
  return out;
}

async function callGroq(
  config: PaperConfig,
  model: string
): Promise<string> {
  // Each Japanese question is roughly 250-350 output tokens. Budget
  // generously but stay under free-tier TPM (8000 for gpt-oss-120b).
  const perQuestion = 380;
  const maxTokens = Math.min(6500, Math.max(1500, config.questionCount * perQuestion));

  const completion = await client().chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(config) },
    ],
    temperature: 0.5,
    max_tokens: maxTokens,
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Groq");
  return raw;
}

export async function generatePaper(
  config: PaperConfig
): Promise<GeneratedPaper> {
  const attempts = [MODEL_PRIMARY, MODEL_FALLBACK, MODEL_PRIMARY];
  const minAcceptable = Math.max(
    3,
    Math.ceil(config.questionCount * 0.8)
  );

  let bestRaw = "";
  let bestModel = "";
  let bestValid: GeneratedQuestion[] = [];
  let bestParsedCount = 0;

  for (const model of attempts) {
    let raw = "";
    try {
      raw = await callGroq(config, model);
    } catch (err) {
      console.warn(`[manabi] groq call failed (${model}):`, err);
      continue;
    }

    const questions = parseStructuredText(raw);
    // Filter to only questions that pass per-question validation. This
    // way one bad block doesn't kill the whole paper.
    const valid: GeneratedQuestion[] = [];
    for (const q of questions) {
      const r = generatedQuestionSchema.safeParse(q);
      if (r.success) valid.push(r.data);
    }

    if (valid.length > bestValid.length) {
      bestValid = valid;
      bestRaw = raw;
      bestModel = model;
      bestParsedCount = questions.length;
    }

    if (valid.length >= minAcceptable) {
      // Renumber 1..N so the user sees a clean sequence even if some
      // blocks were dropped.
      const renumbered = valid
        .slice(0, config.questionCount)
        .map((q, i) => ({ ...q, id: i + 1 }));
      console.log(
        `[manabi] paper accepted (${model}): ${renumbered.length}/${config.questionCount} questions kept`
      );
      return generatedPaperSchema.parse({ questions: renumbered });
    }

    console.warn(
      `[manabi] paper below threshold (${model}): ${valid.length}/${config.questionCount} valid out of ${questions.length} parsed`
    );
  }

  console.error(
    `[manabi] all attempts failed. Best: ${bestValid.length} valid / ${bestParsedCount} parsed (${bestModel}). Raw (first 2000 chars):`,
    bestRaw.slice(0, 2000)
  );
  throw new Error(
    "Groq response did not produce enough valid questions after retries"
  );
}
