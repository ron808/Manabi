import { createHash, randomBytes } from "node:crypto";
import { normalizeAnswer } from "@/lib/ja/normalize";
import type { AnswerCheck, QuestionView, StoredQuestion } from "@/lib/domain/question";

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

/**
 * A salted hash of the answer, so practice mode can mark the moment you tap
 * instead of waiting on a round trip. The server still grades every answer;
 * this only lets the page draw the ◯/✕ early. Exam mode never gets one.
 */
export function answerCheck(q: StoredQuestion): AnswerCheck | null {
  const salt = randomBytes(12).toString("hex");
  if (q.options.length && q.answerIndex != null) {
    return { salt, hashes: [sha256(`${salt}:${q.answerIndex}`)], keepScript: false };
  }
  if (!q.options.length && q.answerText) {
    const accepted = [q.answerText, ...q.acceptedAnswers].map((a) => normalizeAnswer(a, { keepScript: q.keepScript }));
    return { salt, hashes: Array.from(new Set(accepted)).map((a) => sha256(`${salt}:${a}`)), keepScript: q.keepScript };
  }
  return null;
}

/** Adds the check to unanswered practice questions only. */
export function withCheck(view: QuestionView, q: StoredQuestion, mode: "practice" | "exam"): QuestionView {
  if (mode !== "practice" || view.revealed || view.answered) return view;
  return { ...view, check: answerCheck(q) };
}
