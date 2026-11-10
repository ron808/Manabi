"use client";

import { normalizeAnswer } from "@/lib/ja/normalize";
import type { QuestionView } from "@/lib/domain/question";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface LocalVerdict {
  isCorrect: boolean;
  /** The right option, for multiple choice. */
  answerIndex: number | null;
}

/**
 * Marks an answer on the device using the salted hash the server sent with a
 * practice question — no round trip. Returns null when there's no check
 * (exam mode) or the browser can't hash (no secure context).
 */
export async function localVerdict(
  q: QuestionView,
  response: { choice: number } | { text: string }
): Promise<LocalVerdict | null> {
  const check = q.check;
  if (!check || typeof crypto === "undefined" || !crypto.subtle) return null;
  try {
    if ("choice" in response) {
      for (let i = 0; i < q.options.length; i++) {
        if (check.hashes.includes(await sha256(`${check.salt}:${i}`))) {
          return { isCorrect: i === response.choice, answerIndex: i };
        }
      }
      return null;
    }
    const h = await sha256(`${check.salt}:${normalizeAnswer(response.text, { keepScript: check.keepScript })}`);
    return { isCorrect: check.hashes.includes(h), answerIndex: null };
  } catch {
    return null;
  }
}
