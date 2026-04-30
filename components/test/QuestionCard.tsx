"use client";

import { useState, useEffect } from "react";
import type { Question } from "@/lib/types";
import { AnswerOptions } from "./AnswerOptions";

export function QuestionCard({
  question,
  index,
  total,
  locked,
  correctAnswer,
  onSubmit,
}: {
  question: Question;
  index: number;
  total: number;
  locked: boolean;
  correctAnswer: string | null;
  onSubmit: (value: string) => void;
}) {
  const [showGloss, setShowGloss] = useState(false);
  useEffect(() => {
    setShowGloss(false);
  }, [question.id]);

  return (
    <article className="card animate-fade-up rounded-2xl p-6 sm:p-8">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400">
          {question.format}
        </span>
        <span className="text-xs text-white/50">
          {index + 1} of {total}
        </span>
      </header>

      <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
        Q{index + 1}
      </h2>

      {question.passageJp && (
        <div
          className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] p-4"
          lang="ja"
        >
          <p className="jp text-base leading-relaxed text-white/85 sm:text-lg">
            {question.passageJp}
          </p>
        </div>
      )}

      <p
        className="jp mt-5 text-xl leading-relaxed text-white sm:text-2xl"
        lang="ja"
        style={{ fontSize: "max(20px, 1.25rem)" }}
      >
        {question.questionJp}
      </p>

      <button
        type="button"
        onClick={() => setShowGloss((s) => !s)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-brand-400"
        aria-expanded={showGloss}
      >
        <span aria-hidden>🇬🇧</span>
        {showGloss ? "Hide English gloss" : "Show English gloss"}
      </button>
      {showGloss && question.englishGloss && (
        <p className="mt-2 rounded-lg border border-gold-400/30 bg-gold-500/10 p-3 text-sm leading-relaxed text-gold-400/95">
          {question.englishGloss}
        </p>
      )}

      <div className="mt-6">
        <AnswerOptions
          options={question.options}
          locked={locked}
          userAnswer={question.userAnswer}
          correctAnswer={correctAnswer}
          onSubmit={onSubmit}
        />
      </div>
    </article>
  );
}
