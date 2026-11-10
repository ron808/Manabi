import { answersMatch } from "@/lib/ja/normalize";
import { FORMAT_BY_ID, sectionOfLegacyFormat, LEGACY_FORMAT_MAP, type PointKind, type Section } from "./jlpt";

export type PaperMode = "practice" | "exam";
export type PaperStatus = "generated" | "in_progress" | "completed";

export interface TutorTurn {
  role: "user" | "assistant";
  content: string;
}

/** A question as stored (schema v2). Japanese text fields use `{漢字|かんじ}` ruby markup. */
export interface StoredQuestion {
  id: number;
  section: Section;
  format: string;
  point: string;
  pointKind: PointKind;
  passage: string | null;
  audioScript: string | null;
  prompt: string;
  options: string[];
  answerIndex: number | null;
  answerText: string | null;
  acceptedAnswers: string[];
  keepScript: boolean;
  explanationEn: string;
  explanationJp: string;
  gloss: string;
  userChoice: number | null;
  userText: string | null;
  isCorrect: boolean | null;
  answeredAt: Date | string | null;
  guessed: boolean;
  flagged: boolean;
  tutor: TutorTurn[];
}

/** Salted hashes that let practice mode mark instantly (see lib/server/check.ts). */
export interface AnswerCheck {
  salt: string;
  hashes: string[];
  keepScript: boolean;
}

/** What the browser is allowed to see. Answer fields are present only once revealed. */
export interface QuestionView {
  id: number;
  section: Section;
  format: string;
  point: string | null;
  passage: string | null;
  /** Hidden for listening questions until revealed. */
  audioScript: string | null;
  hasAudio: boolean;
  prompt: string;
  options: string[];
  typed: boolean;
  userChoice: number | null;
  userText: string | null;
  answered: boolean;
  guessed: boolean;
  flagged: boolean;
  revealed: boolean;
  isCorrect: boolean | null;
  answerIndex: number | null;
  answerText: string | null;
  explanationEn: string | null;
  explanationJp: string | null;
  gloss: string | null;
  tutor: TutorTurn[];
  check?: AnswerCheck | null;
}

export function isAnswered(q: Pick<StoredQuestion, "userChoice" | "userText">) {
  return q.userChoice != null || (q.userText != null && q.userText !== "");
}

/**
 * Practice mode reveals a question as soon as it's answered; exam mode
 * reveals nothing until the paper is completed.
 */
export function isRevealed(q: StoredQuestion, mode: PaperMode, status: PaperStatus) {
  if (status === "completed") return true;
  return mode === "practice" && isAnswered(q);
}

export function toView(q: StoredQuestion, mode: PaperMode, status: PaperStatus): QuestionView {
  const revealed = isRevealed(q, mode, status);
  const listening = q.audioScript != null && q.audioScript !== "";
  return {
    id: q.id,
    section: q.section,
    format: q.format,
    point: revealed ? q.point || null : null,
    passage: q.passage,
    // The learner hears the script but must not be able to read it first.
    audioScript: listening && !revealed ? null : q.audioScript,
    hasAudio: listening,
    prompt: q.prompt,
    options: q.options,
    typed: q.options.length === 0,
    userChoice: q.userChoice,
    userText: q.userText,
    answered: isAnswered(q),
    guessed: q.guessed,
    flagged: q.flagged,
    revealed,
    isCorrect: revealed ? q.isCorrect : null,
    answerIndex: revealed ? q.answerIndex : null,
    answerText: revealed ? q.answerText : null,
    explanationEn: revealed ? q.explanationEn : null,
    explanationJp: revealed ? q.explanationJp : null,
    gloss: revealed ? q.gloss : null,
    tutor: revealed ? q.tutor ?? [] : [],
  };
}

/**
 * Audio for listening questions is fetched separately so the script never
 * appears in the page before the learner answers.
 */
export function listeningScript(q: StoredQuestion): string | null {
  return q.audioScript || null;
}

export type Response = { choice: number } | { text: string };

export function grade(q: StoredQuestion, response: Response): boolean {
  if ("choice" in response) {
    return q.answerIndex != null && response.choice === q.answerIndex;
  }
  if (q.answerText == null) return false;
  return answersMatch(response.text, q.answerText, {
    keepScript: q.keepScript,
    alternatives: q.acceptedAnswers,
  });
}

// ─── Legacy (v1) papers ────────────────────────────────────────────────────
// v1 stored options as "A: text", answers as letters, and free-text format
// names. Existing production papers are converted on read, never rewritten
// unless the learner resumes them.

export interface LegacyQuestion {
  id: number;
  format?: string;
  questionJp?: string;
  passageJp?: string | null;
  options?: string[] | null;
  correctAnswer?: string;
  explanationJp?: string;
  explanationEn?: string;
  englishGloss?: string;
  userAnswer?: string | null;
  isCorrect?: boolean | null;
  answeredAt?: Date | string | null;
}

const LETTERS = ["A", "B", "C", "D"];

function letterIndex(value: string | null | undefined): number | null {
  if (!value) return null;
  const i = LETTERS.indexOf(value.trim().charAt(0).toUpperCase());
  return i === -1 ? null : i;
}

export function isLegacyQuestion(q: unknown): q is LegacyQuestion {
  return typeof q === "object" && q !== null && "questionJp" in q && !("prompt" in q);
}

export function fromLegacy(q: LegacyQuestion): StoredQuestion {
  const format = q.format ?? "";
  const mappedId = LEGACY_FORMAT_MAP[format];
  const def = mappedId ? FORMAT_BY_ID[mappedId] : undefined;
  const options = (q.options ?? []).map((o) => o.replace(/^\s*[A-D]\s*[:：]\s*/i, ""));
  const mc = options.length > 0;
  return {
    id: q.id,
    section: def?.section ?? sectionOfLegacyFormat(format),
    format: mappedId ?? format,
    point: "",
    pointKind: def?.kind ?? "vocab",
    passage: q.passageJp ?? null,
    audioScript: null,
    prompt: q.questionJp ?? "",
    options,
    answerIndex: mc ? letterIndex(q.correctAnswer) : null,
    answerText: mc ? null : q.correctAnswer ?? null,
    acceptedAnswers: [],
    keepScript: false,
    explanationEn: q.explanationEn ?? "",
    explanationJp: q.explanationJp ?? "",
    gloss: q.englishGloss ?? "",
    userChoice: mc ? letterIndex(q.userAnswer) : null,
    userText: mc ? null : q.userAnswer ?? null,
    isCorrect: q.isCorrect ?? null,
    answeredAt: q.answeredAt ?? null,
    guessed: false,
    flagged: false,
    tutor: [],
  };
}

export function normalizeStoredQuestion(q: unknown): StoredQuestion {
  if (isLegacyQuestion(q)) return fromLegacy(q);
  const s = q as StoredQuestion;
  return {
    ...s,
    passage: s.passage ?? null,
    audioScript: s.audioScript ?? null,
    options: s.options ?? [],
    acceptedAnswers: s.acceptedAnswers ?? [],
    guessed: s.guessed ?? false,
    flagged: s.flagged ?? false,
    tutor: s.tutor ?? [],
    point: s.point ?? "",
  };
}

export function formatLabel(format: string): string {
  return FORMAT_BY_ID[format]?.label ?? format;
}
