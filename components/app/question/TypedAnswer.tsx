"use client";

import { useState } from "react";
import { KanaInput } from "@/components/ui/KanaInput";
import { Batsu, Maru } from "@/components/ui/Mark";
import type { QuestionView } from "@/lib/domain/question";

export function TypedAnswer({
  q,
  onSubmit,
  disabled,
  pending,
  animateMarks = true,
  draft,
  onDraft,
  submitLabel = "Check answer",
}: {
  q: QuestionView;
  onSubmit?: (text: string) => void;
  disabled?: boolean;
  pending?: boolean;
  animateMarks?: boolean;
  /** Controlled draft (exam mode keeps it while you move between questions). */
  draft?: string;
  onDraft?: (v: string) => void;
  submitLabel?: string;
}) {
  const [local, setLocal] = useState(q.userText ?? "");
  const value = draft ?? local;
  const setValue = onDraft ?? setLocal;

  if (q.revealed) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-md bg-surface px-4 py-3.5 shadow-[inset_0_0_0_1px_rgb(var(--line)/0.12)]">
          <p className="eyebrow">Your answer</p>
          <p className="jp-sans mt-1 text-lg">{q.userText || <span className="text-ink/45">— no answer —</span>}</p>
          {q.isCorrect ? <Maru animate={animateMarks} /> : q.userText ? <Batsu animate={animateMarks} /> : null}
        </div>
        {!q.isCorrect && (
          <div className="rounded-md bg-surface px-4 py-3.5 shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.4)]">
            <p className="eyebrow">Answer</p>
            <p className="jp-sans mt-1 text-lg text-accent-ink">{q.answerText}</p>
          </div>
        )}
      </div>
    );
  }

  const submit = () => {
    const v = value.trim();
    if (v && onSubmit) onSubmit(v);
  };

  return (
    <div className="space-y-3">
      <label className="label" htmlFor={`typed-${q.id}`}>
        Type your answer
      </label>
      <KanaInput id={`typed-${q.id}`} value={value} onChange={setValue} onSubmit={submit} disabled={disabled || pending} />
      {onSubmit && (
        <button type="button" onClick={submit} disabled={!value.trim() || disabled || pending} className="btn btn-ink">
          {pending ? "Saving…" : submitLabel}
        </button>
      )}
    </div>
  );
}
