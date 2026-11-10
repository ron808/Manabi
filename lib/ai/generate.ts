import { FORMAT_BY_ID, SECTIONS, type Level } from "@/lib/domain/jlpt";
import { cleanPointLabel } from "@/lib/domain/points";
import type { StoredQuestion } from "@/lib/domain/question";
import { hasJapanese } from "@/lib/ja/normalize";
import { plainText, sanitizeRuby } from "@/lib/ja/ruby";
import { groq, fixturesEnabled } from "./client";
import { checkerFor, coolDown, cooldownFor, nextModels, reasoningOptions } from "./models";
import { fixtureQuestions } from "./fixture";
import { VERIFIER_SYSTEM, WRITER_SYSTEM, verifierPrompt, writerPrompt, type BatchSpec } from "./prompt";
import {
  PAPER_JSON_SCHEMA,
  VERIFY_JSON_SCHEMA,
  generatedQuestionSchema,
  verifySchema,
  type GeneratedQuestion,
} from "./schema";

export interface GenerateInput {
  level: Level;
  difficulty: number;
  formats: string[];
  questionCount: number;
  customInstructions: string;
  focusPoints: string[];
}

export interface Progress {
  done: number;
  total: number;
}

const BATCH_SIZE = 5;
const CONCURRENCY = 2;

export class GenerationError extends Error {}

/**
 * Writes a paper in small batches (Groq can't stream structured output, so
 * batches are how progress is reported), rotating the batches across the
 * free models (see ./models). Validates every question, has a different
 * model answer each multiple-choice question blind and drops the ones it
 * confidently disagrees with, then tops up anything lost.
 */
export async function generateQuestions(
  input: GenerateInput,
  onProgress: (p: Progress) => void = () => {}
): Promise<StoredQuestion[]> {
  const total = input.questionCount;
  const slots = planSlots(input.formats, total);
  const write = fixturesEnabled() ? writeFixtureBatch : writeBatch;

  const kept: Prepared[] = [];
  let done = 0;
  const report = () => onProgress({ done: Math.min(done, total), total });
  report();

  const runRound = async (roundSlots: string[], avoid: string[]) => {
    const batches = chunk(roundSlots, BATCH_SIZE);
    await mapLimit(batches, CONCURRENCY, async (formats, i) => {
      const spec: BatchSpec = {
        level: input.level,
        difficulty: input.difficulty,
        formats,
        customInstructions: input.customInstructions,
        focusPoints: spreadFocus(input.focusPoints, i, batches.length),
        avoidPoints: avoid,
      };
      let questions: Prepared[] = [];
      try {
        questions = await write(spec);
      } catch (err) {
        // One failed batch shouldn't sink the paper; the top-up round refills it.
        console.warn("[manabi] batch failed", err instanceof Error ? err.message : err);
      }
      for (const q of questions) {
        if (kept.length >= total) break;
        if (kept.some((k) => k.key === q.key)) continue;
        kept.push(q);
      }
      done = kept.length;
      report();
    });
  };

  await runRound(slots, []);

  const missing = total - kept.length;
  if (missing > 0) {
    // One top-up round for whatever validation or the checker threw away.
    const refill = planSlots(input.formats, missing);
    await runRound(refill, kept.map((k) => k.q.point).slice(0, 30));
  }

  const minimum = Math.max(3, Math.ceil(total * 0.8));
  if (kept.length < minimum) {
    throw new GenerationError(`Only ${kept.length} of ${total} questions passed checks`);
  }

  const order = new Map(SECTIONS.map((s, i) => [s.id, i]));
  return kept
    .slice(0, total)
    .map((k) => k.q)
    .sort((a, b) => (order.get(a.section) ?? 0) - (order.get(b.section) ?? 0))
    .map((q, i) => ({ ...q, id: i + 1 }));
}

// ─── Planning ──────────────────────────────────────────────────────────────

/** Spreads formats evenly over the paper: a,b,c,a,b,c,… */
export function planSlots(formats: string[], count: number): string[] {
  const valid = formats.filter((f) => FORMAT_BY_ID[f]);
  const list = valid.length ? valid : ["grammar_form"];
  return Array.from({ length: count }, (_, i) => list[i % list.length]);
}

function spreadFocus(points: string[], batch: number, batches: number): string[] {
  if (!points.length) return [];
  const per = Math.max(1, Math.ceil(points.length / batches));
  const slice = points.slice(batch * per, batch * per + per);
  return slice.length ? slice : points.slice(0, per);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

// ─── Writing and checking ──────────────────────────────────────────────────

interface Prepared {
  key: string;
  q: StoredQuestion;
}

async function writeBatch(spec: BatchSpec): Promise<Prepared[]> {
  const { questions, model } = await callWriter(spec);
  const prepared = questions
    .map((g, i) => prepare(g, spec.formats[i] ?? g.format))
    .filter((p): p is Prepared => p !== null);
  return verify(prepared, checkerFor(model));
}

/** Tries the models in rotation order until one returns usable questions. */
async function callWriter(spec: BatchSpec): Promise<{ questions: GeneratedQuestion[]; model: string }> {
  let lastError: unknown;
  for (const model of nextModels()) {
    try {
      const completion = await groq().chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: WRITER_SYSTEM },
            { role: "user", content: writerPrompt(spec) },
          ],
          temperature: 0.7,
          ...reasoningOptions(model, "medium"),
          max_completion_tokens: 2000 + 700 * spec.formats.length,
          response_format: {
            type: "json_schema",
            json_schema: { name: "paper", strict: true, schema: PAPER_JSON_SCHEMA as unknown as Record<string, unknown> },
          },
        },
        // Don't sit in the SDK's backoff on a rate limit: move to the next model.
        { maxRetries: 0 }
      );
      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("empty response");
      const parsed = JSON.parse(content) as { questions?: unknown[] };
      const out: GeneratedQuestion[] = [];
      for (const q of parsed.questions ?? []) {
        const r = generatedQuestionSchema.safeParse(q);
        if (r.success) out.push(r.data);
      }
      if (out.length) return { questions: out, model };
      throw new Error("no valid questions in response");
    } catch (err) {
      lastError = err;
      coolDown(model, cooldownFor(err));
      console.warn(`[manabi] writer failed (${model})`, err instanceof Error ? err.message : err);
    }
  }
  throw new GenerationError(`Writer failed: ${lastError instanceof Error ? lastError.message : "unknown"}`);
}

/** Cleans one generated question and rejects anything unusable. */
export function prepare(g: GeneratedQuestion, slotFormat: string): Prepared | null {
  const def = FORMAT_BY_ID[slotFormat] ?? FORMAT_BY_ID[g.format];
  if (!def) return null;
  const typed = def.answer === "typed";

  const prompt = sanitizeRuby(g.prompt.trim());
  const passage = g.passage?.trim() ? sanitizeRuby(g.passage.trim()) : null;
  const audioScript = g.audioScript?.trim() ? sanitizeRuby(g.audioScript.trim()) : null;
  if (!hasJapanese(prompt) && !hasJapanese(passage ?? "") && !hasJapanese(audioScript ?? "")) return null;
  if (def.section === "listening" && !audioScript) return null;

  let options: string[] = [];
  let answerIndex: number | null = null;
  let answerText: string | null = null;
  let acceptedAnswers: string[] = [];

  if (typed) {
    answerText = plainText(g.answerText ?? "").trim();
    if (!answerText) return null;
    acceptedAnswers = g.acceptedAnswers.map((a) => plainText(a).trim()).filter(Boolean);
  } else {
    // Strip any numbering the model added anyway ("1. ", "A) ").
    options = g.options.map((o) => sanitizeRuby(o.replace(/^\s*(?:[1-4A-D]|[１-４])\s*[.)．、:：]\s*/, "").trim()));
    if (options.length !== 4 || options.some((o) => !o)) return null;
    if (new Set(options.map((o) => plainText(o))).size !== 4) return null;
    if (g.answerIndex == null || g.answerIndex < 0 || g.answerIndex > 3) return null;
    ({ options, answerIndex } = shuffleOptions(options, g.answerIndex));
  }

  const q: StoredQuestion = {
    id: 0,
    section: def.section,
    format: def.id,
    point: cleanPointLabel(plainText(g.point)),
    pointKind: def.kind,
    passage: def.section === "listening" ? null : passage,
    audioScript: def.section === "listening" ? audioScript : null,
    prompt,
    options,
    answerIndex,
    answerText,
    acceptedAnswers,
    keepScript: !!def.keepScript,
    explanationEn: plainText(g.explanationEn).trim(),
    explanationJp: sanitizeRuby(g.explanationJp.trim()),
    gloss: plainText(g.gloss).trim(),
    userChoice: null,
    userText: null,
    isCorrect: null,
    answeredAt: null,
    guessed: false,
    flagged: false,
    tutor: [],
  };
  return { key: plainText(prompt) + "|" + plainText(passage ?? audioScript ?? ""), q };
}

/** Fisher–Yates on the options; models love putting the answer first. */
export function shuffleOptions(options: string[], answerIndex: number, rand = Math.random) {
  const order = options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { options: order.map((i) => options[i]), answerIndex: order.indexOf(answerIndex) };
}

async function verify(items: Prepared[], model: string): Promise<Prepared[]> {
  const mc = items.filter((p) => p.q.options.length === 4);
  if (!mc.length) return items;
  try {
    const completion = await groq().chat.completions.create({
      model,
      messages: [
        { role: "system", content: VERIFIER_SYSTEM },
        {
          role: "user",
          content: verifierPrompt(
            mc.map((p, i) => ({
              n: i + 1,
              passage: p.q.passage ? plainText(p.q.passage) : null,
              script: p.q.audioScript ? plainText(p.q.audioScript) : null,
              prompt: plainText(p.q.prompt),
              options: p.q.options.map(plainText),
            }))
          ),
        },
      ],
      temperature: 0,
      ...reasoningOptions(model, "low"),
      max_completion_tokens: 2500,
      response_format: {
        type: "json_schema",
        json_schema: { name: "answers", strict: true, schema: VERIFY_JSON_SCHEMA as unknown as Record<string, unknown> },
      },
    });
    const parsed = verifySchema.safeParse(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
    if (!parsed.success) return items;
    const rejected = new Set<Prepared>();
    for (const a of parsed.data.answers) {
      const p = mc[a.n - 1];
      if (p && a.sure && a.choice - 1 !== p.q.answerIndex) rejected.add(p);
    }
    if (rejected.size) console.warn(`[manabi] checker (${model}) rejected ${rejected.size}/${mc.length} questions`);
    return items.filter((p) => !rejected.has(p));
  } catch (err) {
    coolDown(model, cooldownFor(err));
    // The checker is a safety net, not a gate: if it's down, keep the batch.
    console.warn("[manabi] checker unavailable", err instanceof Error ? err.message : err);
    return items;
  }
}

async function writeFixtureBatch(spec: BatchSpec): Promise<Prepared[]> {
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 500));
  return fixtureQuestions(spec.formats)
    .map((g, i) => prepare(g, spec.formats[i]))
    .filter((p): p is Prepared => p !== null)
    .map((p) => ({ ...p, key: `${p.key}#${Math.random()}` }));
}
