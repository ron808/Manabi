"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";

export function AnswerReview({ questions }: { questions: Question[] }) {
  const [filter, setFilter] = useState<"all" | "wrong">("all");
  const list =
    filter === "wrong" ? questions.filter((q) => q.isCorrect === false) : questions;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-semibold">Answer review</h2>
        <div className="inline-flex w-full rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs sm:w-auto">
          {(["all", "wrong"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`flex-1 rounded-full px-4 py-2 transition-colors sm:flex-none ${
                filter === k
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white"
              }`}
            >
              {k === "all" ? "All" : "Wrong only"}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card rounded-2xl p-8 text-center text-white/55">
          {filter === "wrong"
            ? "Perfect score — no wrong answers!"
            : "No questions to show."}
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((q, idx) => (
            <li key={q.id} className="card animate-fade-up rounded-2xl p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/70">
                  Q{q.id}
                </span>
                <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-xs text-brand-400">
                  {q.format}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    q.isCorrect === true
                      ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : q.isCorrect === false
                      ? "border border-sakura-500/30 bg-sakura-500/10 text-sakura-200"
                      : "border border-white/10 bg-white/5 text-white/50"
                  }`}
                >
                  {q.isCorrect === true
                    ? "Correct"
                    : q.isCorrect === false
                    ? "Wrong"
                    : "Skipped"}
                </span>
                <span className="ml-auto text-xs text-white/40">#{idx + 1}</span>
              </div>

              {q.passageJp && (
                <p className="jp mb-3 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-sm text-white/75" lang="ja">
                  {q.passageJp}
                </p>
              )}

              <p className="jp text-lg text-white" lang="ja">
                {q.questionJp}
              </p>

              {q.options && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {q.options.map((opt) => {
                    const letter = (opt.match(/^\s*([A-D])/i)?.[1] || "").toUpperCase();
                    const isUser = q.userAnswer?.toUpperCase() === letter;
                    const isCorrect = q.correctAnswer.toUpperCase() === letter;
                    return (
                      <li
                        key={letter}
                        className={`jp rounded-lg border px-3 py-2 ${
                          isCorrect
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                            : isUser
                            ? "border-sakura-500/40 bg-sakura-500/10 text-sakura-100"
                            : "border-white/8 bg-white/[0.02] text-white/70"
                        }`}
                        lang="ja"
                      >
                        {opt}
                      </li>
                    );
                  })}
                </ul>
              )}

              {!q.options && (
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-xs uppercase tracking-wider text-white/45">
                      Your answer
                    </div>
                    <div
                      className={`jp mt-1 ${
                        q.isCorrect === true
                          ? "text-emerald-200"
                          : q.userAnswer
                          ? "text-sakura-200"
                          : "text-white/50"
                      }`}
                      lang="ja"
                    >
                      {q.userAnswer || "— skipped —"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
                    <div className="text-xs uppercase tracking-wider text-emerald-300/80">
                      Correct answer
                    </div>
                    <div className="jp mt-1 text-emerald-100" lang="ja">
                      {q.correctAnswer}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/45">
                    Explanation (English)
                  </div>
                  <p className="mt-1 text-white/85">{q.explanationEn}</p>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/45">
                    English gloss
                  </div>
                  <p className="mt-1 text-white/75">{q.englishGloss}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
