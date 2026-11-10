import { Ruby } from "@/components/ui/Ruby";
import type { QuestionView } from "@/lib/domain/question";
import { plainText } from "@/lib/ja/ruby";
import { TutorChat } from "./TutorChat";

export function Explanation({
  q,
  furigana,
  tutorUrl,
}: {
  q: QuestionView;
  furigana: boolean;
  tutorUrl: string | null;
}) {
  if (!q.revealed) return null;
  // Marked on the device; the explanation is still on its way from the server.
  if (q.explanationEn == null && q.gloss == null) {
    return (
      <div className="space-y-2.5 border-t border-ink/10 pt-5" aria-busy="true" aria-label="Loading the explanation">
        <div className="skeleton h-4 w-2/5" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-4/5" />
      </div>
    );
  }
  const mine = q.userChoice != null ? plainText(q.options[q.userChoice] ?? "") : q.userText;
  const suggestions = [
    q.isCorrect === false && mine ? `Why isn't ${mine} right?` : "Why is this the answer?",
    "Give me two more examples",
    "Explain it more simply",
  ];
  return (
    <div className="space-y-4 border-t border-ink/10 pt-5">
      {q.point && (
        <p className="text-sm">
          <span className="text-ink/55">Testing </span>
          <span className="font-medium">{q.point}</span>
        </p>
      )}
      {q.explanationEn && <p className="max-w-prose text-[0.98rem] leading-relaxed">{q.explanationEn}</p>}
      {q.explanationJp && (
        <Ruby as="p" text={q.explanationJp} furigana={furigana} className="jp max-w-prose text-[1rem] leading-[2] text-ink/80" />
      )}
      {q.gloss && (
        <p className="max-w-prose text-sm leading-relaxed text-ink/60">
          <span className="font-medium text-ink/70">Translation · </span>
          {q.gloss}
        </p>
      )}
      {tutorUrl && <TutorChat url={tutorUrl} initial={q.tutor} suggestions={suggestions} />}
    </div>
  );
}
