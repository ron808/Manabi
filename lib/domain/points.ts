import type { PointKind } from "./jlpt";

// A separating dash: em/en dash anywhere, or a hyphen with spaces around it.
// Hyphens inside words ("non-volitional", "te-form") are left alone.
const DASH = /\s*[—–]\s*|\s+-\s+/g;

/** Stable key for a learning point so "で — place of action" and "で - Place of action" merge. */
export function pointKey(kind: PointKind, label: string): string {
  const norm = label
    .normalize("NFKC")
    .replace(/[\s　]+/g, " ")
    .replace(DASH, " — ")
    .trim()
    .toLowerCase();
  return `${kind}:${norm}`;
}

export function cleanPointLabel(label: string): string {
  return label.normalize("NFKC").replace(/[\s　]+/g, " ").replace(DASH, " — ").trim().slice(0, 80);
}

/** Laplace-smoothed accuracy, so one lucky answer doesn't read as mastery. */
export function masteryScore(seen: number, correct: number): number {
  return (correct + 1) / (seen + 2);
}
