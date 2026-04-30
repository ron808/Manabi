"use client";

import { ALLOWED_QUESTION_COUNTS } from "@/lib/validation/schemas";

export function TestSettings({
  questionCount,
  onQuestionCount,
  timeLimit,
  onTimeLimit,
}: {
  questionCount: number;
  onQuestionCount: (n: number) => void;
  timeLimit: number | null;
  onTimeLimit: (m: number | null) => void;
}) {
  const timed = timeLimit !== null;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
          Number of questions
        </label>
        <div className="flex flex-wrap gap-2">
          {ALLOWED_QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onQuestionCount(n)}
              data-active={n === questionCount}
              className="pill !px-4"
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs uppercase tracking-wider text-white/50">
            Time limit
          </label>
          <button
            type="button"
            onClick={() => onTimeLimit(timed ? null : 20)}
            className="pill"
            data-active={timed}
            aria-pressed={timed}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                timed ? "bg-brand-400" : "bg-white/30"
              }`}
            />
            {timed ? "Timed" : "Untimed"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={180}
            value={timed ? timeLimit ?? 20 : 0}
            onChange={(e) =>
              onTimeLimit(Math.max(1, Math.min(180, Number(e.target.value) || 1)))
            }
            disabled={!timed}
            className="input max-w-[120px] disabled:opacity-50"
          />
          <span className="text-sm text-white/60">minutes</span>
        </div>
      </div>
    </div>
  );
}
