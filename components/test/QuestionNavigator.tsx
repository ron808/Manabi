"use client";

export type NavStatus = "unanswered" | "correct" | "incorrect";

export function QuestionNavigator({
  total,
  current,
  statuses,
  onJump,
}: {
  total: number;
  current: number;
  statuses: NavStatus[];
  onJump: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: total }).map((_, i) => {
        const s = statuses[i] ?? "unanswered";
        const isCurrent = i === current;
        const base =
          "relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all";
        let color = "bg-white/5 text-white/60 hover:bg-white/10";
        if (s === "correct")
          color =
            "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40 hover:bg-emerald-500/25";
        if (s === "incorrect")
          color =
            "bg-sakura-500/20 text-sakura-100 ring-1 ring-sakura-500/40 hover:bg-sakura-500/25";
        const ring = isCurrent
          ? " outline outline-2 outline-offset-2 outline-brand-400"
          : "";
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            className={base + " " + color + ring}
            aria-label={`Jump to question ${i + 1}`}
            aria-current={isCurrent ? "true" : undefined}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
