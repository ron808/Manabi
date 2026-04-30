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
    <section className="card grid gap-6 rounded-2xl p-6 sm:p-8 md:grid-cols-[auto,1fr]">
      <div className="relative grid h-40 w-40 place-items-center">
        <svg width={160} height={160} className="-rotate-90">
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
          <div className="grid gap-1.5">
            {Array.from(buckets.entries()).map(([k, v]) => {
              const p = v.total > 0 ? (v.correct / v.total) * 100 : 0;
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-44 truncate text-sm text-white/70">{k}</span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 to-sakura-400"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm text-white/60">
                    {v.correct}/{v.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
