"use client";

import { Batsu, Maru } from "@/components/ui/Mark";
import { Ruby } from "@/components/ui/Ruby";
import type { QuestionView } from "@/lib/domain/question";

/**
 * The four options, numbered 1–4 like the real test. Once revealed, the red
 * pen circles the right answer and crosses out a wrong pick.
 */
export function ChoiceList({
  q,
  furigana,
  selected,
  pending,
  onChoose,
  disabled,
  animateMarks = true,
}: {
  q: QuestionView;
  furigana: boolean;
  /** The choice to show as picked (the user's answer, or an unsent exam selection). */
  selected: number | null;
  pending?: boolean;
  onChoose?: (i: number) => void;
  disabled?: boolean;
  animateMarks?: boolean;
}) {
  const revealed = q.revealed && q.answerIndex != null;
  return (
    <ol className="grid gap-2.5" aria-label="Options">
      {q.options.map((opt, i) => {
        const isAnswer = revealed && q.answerIndex === i;
        const isPick = selected === i;
        const wrongPick = revealed && isPick && !isAnswer;
        const dim = revealed && !isAnswer && !isPick;
        const interactive = !!onChoose && !disabled && !revealed;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => onChoose?.(i)}
              disabled={!interactive}
              aria-pressed={isPick}
              className={`relative flex min-h-[58px] w-full items-center gap-4 rounded-md px-4 py-3 text-left transition-[box-shadow,opacity,background-color] duration-200 ${
                isPick && !revealed
                  ? "bg-surface shadow-[inset_0_0_0_2px_rgb(var(--ink))]"
                  : "bg-surface shadow-[inset_0_0_0_1px_rgb(var(--line)/0.12)]"
              } ${interactive ? "cursor-pointer hover:shadow-[inset_0_0_0_1px_rgb(var(--line)/0.35)]" : "cursor-default"} ${
                dim ? "opacity-55" : ""
              }`}
            >
              <span
                className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold tabular transition-colors ${
                  isPick && !revealed ? "bg-ink text-ground" : "text-ink/70 shadow-[inset_0_0_0_1px_rgb(var(--line)/0.25)]"
                }`}
                aria-hidden
              >
                {i + 1}
              </span>
              <Ruby text={opt} furigana={furigana} className={`jp min-w-0 flex-1 text-[1.12rem] ${furigana ? "leading-[2]" : "leading-snug"}`} />
              {pending && isPick && (
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-ink/50" aria-label="Checking" />
              )}
              {isAnswer && <Maru animate={animateMarks} delay={wrongPick ? 0.35 : 0} />}
              {wrongPick && <Batsu animate={animateMarks} />}
              {revealed && (
                <span className="sr-only">{isAnswer ? (isPick ? "Your answer — correct" : "Correct answer") : wrongPick ? "Your answer — wrong" : ""}</span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
