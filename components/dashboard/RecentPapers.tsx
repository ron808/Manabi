import Link from "next/link";
import type { PaperSummary } from "@/lib/types";
import { formatMMSS } from "@/components/test/Timer";

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} d ago`;
  return d.toLocaleDateString();
}

export function RecentPapers({ papers }: { papers: PaperSummary[] }) {
  if (papers.length === 0) {
    return (
      <div className="card rounded-2xl p-8 text-center">
        <p className="text-white/60">
          No papers yet. Start your first test to begin tracking your progress.
        </p>
      </div>
    );
  }
  return (
    <ul className="grid gap-3">
      {papers.map((p) => {
        const pct =
          p.score != null && p.totalQuestions > 0
            ? Math.round((p.score / p.totalQuestions) * 100)
            : null;
        const isCompleted = p.status === "completed";
        const href = isCompleted ? `/results/${p._id}` : `/test/${p._id}`;
        return (
          <li key={p._id}>
            <Link
              href={href}
              className="card card-hover flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3.5 sm:gap-4 sm:px-5 sm:py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/55 sm:text-xs">
                  <span>{relativeTime(p.createdAt)}</span>
                  <span aria-hidden>•</span>
                  <span>{p.config.questionCount} Qs</span>
                  {p.timeTakenSeconds != null && (
                    <>
                      <span aria-hidden>•</span>
                      <span className="font-mono">
                        {formatMMSS(p.timeTakenSeconds)}
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[15px] font-medium text-white sm:text-base">
                  {p.config.level} ·{" "}
                  <span className="text-white/65">
                    {p.config.formats.slice(0, 2).join(", ")}
                    {p.config.formats.length > 2 ? "…" : ""}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {!isCompleted ? (
                  <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-400 sm:px-3 sm:text-xs">
                    {p.status === "in_progress" ? "Resume" : "Start"}
                  </span>
                ) : (
                  <div className="text-right">
                    <div className="font-display text-lg font-semibold leading-tight text-white sm:text-xl">
                      {pct ?? "—"}%
                    </div>
                    <div className="text-[10px] text-white/45 sm:text-[11px]">
                      {p.score}/{p.totalQuestions}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
