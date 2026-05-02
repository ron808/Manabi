"use client";

import type { PaperFull } from "@/lib/types";
import { formatMMSS } from "@/components/test/Timer";

function performanceLabel(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: "Excellent", color: "text-emerald-300" };
  if (pct >= 70) return { label: "Good", color: "text-brand-400" };
  if (pct >= 50) return { label: "Needs practice", color: "text-gold-400" };
  return { label: "Keep studying", color: "text-sakura-300" };
}

export function ScoreSummary({ paper }: { paper: PaperFull }) {
  const score = paper.score ?? 0;
  const total = paper.totalQuestions;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const perf = performanceLabel(pct);

  // accuracy by format
  const buckets = new Map<string, { correct: number; total: number }>();
  for (const q of paper.questions) {
    const key = q.format || "Other";
    const b = buckets.get(key) ?? { correct: 0, total: 0 };
    b.total += 1;
    if (q.isCorrect === true) b.correct += 1;
    buckets.set(key, b);
  }

  const r = 60;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);

  return (
    <section className="card grid gap-5 rounded-2xl p-4 sm:gap-6 sm:p-8 md:grid-cols-[auto,1fr]">
      <div className="relative mx-auto grid h-36 w-36 place-items-center sm:h-40 sm:w-40 md:mx-0">
        <svg viewBox="0 0 160 160" className="-rotate-90 h-full w-full">
          <circle
            cx={80}
            cy={80}
            r={r}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={10}
            fill="none"
          />
          <circle
            cx={80}
            cy={80}
            r={r}
            stroke="url(#g)"
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 700ms ease" }}
          />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7C7BFF" />
              <stop offset="100%" stopColor="#F0467F" />
            </linearGradient>
          </defs>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-3xl font-semibold leading-none">{pct}%</span>
          <span className={`mt-1.5 max-w-[6.5rem] text-[11px] font-medium leading-tight ${perf.color}`}>
            {perf.label}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="text-sm text-white/55">Score</div>
          <div className="font-display text-4xl font-semibold">
            {score} <span className="text-white/40">/ {total}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/50">Time taken</div>
            <div className="font-mono text-white">
              {paper.timeTakenSeconds != null
                ? formatMMSS(paper.timeTakenSeconds)
                : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-white/50">Level · Difficulty</div>
            <div className="text-white">
              {paper.config.level} · {paper.config.difficulty}/5
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-white/45">
            Accuracy by format
          </div>
          <div className="grid gap-2">
            {Array.from(buckets.entries()).map(([k, v]) => {
              const p = v.total > 0 ? (v.correct / v.total) * 100 : 0;
              return (
                <div key={k} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-white/70">
                      {k}
                    </span>
                    <span className="shrink-0 text-white/55">
                      {v.correct}/{v.total}
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 to-sakura-400 transition-[width] duration-700"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
