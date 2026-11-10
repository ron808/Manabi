"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { saveSetting } from "@/lib/client/api";
import type { QuestionView } from "@/lib/domain/question";
import { ChoiceList } from "./question/ChoiceList";
import { Explanation } from "./question/Explanation";
import { QuestionLabel, QuestionStem } from "./question/QuestionStem";
import { TypedAnswer } from "./question/TypedAnswer";

type Filter = "all" | "wrong" | "flagged" | "guessed";

export function AnswerReview({
  paperId,
  questions,
  furiganaDefault,
}: {
  paperId: string;
  questions: QuestionView[];
  furiganaDefault: boolean;
}) {
  const [filter, setFilter] = useState<Filter>(questions.some((q) => q.isCorrect !== true) ? "wrong" : "all");
  const [furigana, setFurigana] = useState(furiganaDefault);
  const counts = {
    all: questions.length,
    wrong: questions.filter((q) => q.isCorrect !== true).length,
    flagged: questions.filter((q) => q.flagged).length,
    guessed: questions.filter((q) => q.guessed).length,
  };
  const list = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) =>
      filter === "wrong" ? q.isCorrect !== true : filter === "flagged" ? q.flagged : filter === "guessed" ? q.guessed : true
    );

  const tabs: { id: Filter; label: string }[] = [
    { id: "wrong", label: "To learn" },
    { id: "all", label: "All" },
    ...(counts.flagged ? [{ id: "flagged" as const, label: "Flagged" }] : []),
    ...(counts.guessed ? [{ id: "guessed" as const, label: "Guessed" }] : []),
  ];

  return (
    <section aria-labelledby="review-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="review-title" className="text-xl">
          Answer by answer
        </h2>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Filter" className="scrollbar-none flex gap-1.5 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={filter === t.id}
                data-on={filter === t.id}
                onClick={() => setFilter(t.id)}
                className="chip !min-h-[36px] shrink-0 !text-[0.82rem]"
              >
                {t.label} <span className="tabular opacity-60">{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setFurigana(!furigana);
              saveSetting({ furigana: !furigana });
            }}
            aria-pressed={furigana}
            className="chip !min-h-[36px] shrink-0 !px-3 !text-[0.8rem]"
          >
            <span className="jp-sans">ふりがな</span>
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="panel p-6 text-center text-ink/60">Nothing here — every answer was right.</p>
      ) : (
        <ol className="space-y-4">
          {list.map(({ q, i }) => (
            <ReviewItem key={q.id} q={q} index={i} paperId={paperId} furigana={furigana} />
          ))}
        </ol>
      )}
    </section>
  );
}

function ReviewItem({ q, index, paperId, furigana }: { q: QuestionView; index: number; paperId: string; furigana: boolean }) {
  const [open, setOpen] = useState(q.isCorrect !== true);
  return (
    <li className="sheet p-5 sm:p-7">
      <div className="mb-4 flex items-start justify-between gap-3">
        <QuestionLabel q={q} index={index} />
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            q.isCorrect ? "bg-ink/[0.06] text-ink/70" : q.answered ? "bg-accent/10 text-accent-ink" : "bg-ink/[0.06] text-ink/50"
          }`}
        >
          {q.isCorrect ? "Right" : q.answered ? "Wrong" : "Skipped"}
        </span>
      </div>
      <QuestionStem q={q} furigana={furigana} scriptUrl={q.hasAudio ? `/api/papers/${paperId}/questions/${q.id}/audio` : null} />
      <div className="mt-6">
        {q.typed ? <TypedAnswer q={q} animateMarks={false} /> : <ChoiceList q={q} furigana={furigana} selected={q.userChoice} animateMarks={false} />}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink/65 hover:text-ink"
      >
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        {open ? "Hide explanation" : "Explanation"}
      </button>
      {open && (
        <div className="mt-4">
          <Explanation q={q} furigana={furigana} tutorUrl={`/api/papers/${paperId}/questions/${q.id}/explain`} />
        </div>
      )}
    </li>
  );
}
