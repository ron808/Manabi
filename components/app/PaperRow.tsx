import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PaperSummary } from "@/lib/server/papers";

const SOURCE: Record<string, string> = {
  daily: "Today's mix",
  weak_spots: "Weak spots",
  regenerate: "Again",
  custom: "",
};

export function relativeDay(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: days > 300 ? "numeric" : undefined });
}

export function PaperRow({ p }: { p: PaperSummary }) {
  const done = p.status === "completed";
  const pct = done && p.totalQuestions ? Math.round(((p.score ?? 0) / p.totalQuestions) * 100) : null;
  const label = SOURCE[p.source];
  return (
    <li>
      <Link
        href={done ? `/results/${p.id}` : `/test/${p.id}`}
        className="group flex items-center gap-4 rounded-md px-3 py-3.5 transition-colors hover:bg-ink/[0.04] sm:px-4"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-sm font-semibold tabular">
          {p.level || "—"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {label || (p.mode === "exam" ? "Exam" : "Practice")} · {p.totalQuestions} questions
          </span>
          <span className="block truncate text-sm text-ink/55">
            {relativeDay(p.completedAt ?? p.createdAt)}
            {p.mode === "exam" && label ? " · Exam" : ""}
            {!done && ` · ${p.answered}/${p.totalQuestions} answered`}
          </span>
        </span>
        {done ? (
          <span className="text-right">
            <span className="block font-serif text-2xl leading-none tabular">{pct}%</span>
            <span className="text-xs tabular text-ink/50">
              {p.score}/{p.totalQuestions}
            </span>
          </span>
        ) : (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-ink">
            {p.answered ? "Resume" : "Start"}
          </span>
        )}
        <ChevronRight size={18} className="shrink-0 text-ink/30 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}
