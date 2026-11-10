import { Ruby } from "@/components/ui/Ruby";
import { FORMAT_BY_ID, SECTIONS } from "@/lib/domain/jlpt";
import type { QuestionView } from "@/lib/domain/question";
import { ListeningPlayer } from "./ListeningPlayer";

export function QuestionLabel({ q, index }: { q: QuestionView; index?: number }) {
  const format = FORMAT_BY_ID[q.format];
  const section = SECTIONS.find((s) => s.id === q.section);
  return (
    <p className="eyebrow flex flex-wrap items-baseline gap-x-2">
      {index != null && <span className="tabular text-ink/80">問 {index + 1}</span>}
      <span>
        {section?.label ?? "Question"}
        {format ? ` · ${format.label}` : q.format ? ` · ${q.format}` : ""}
      </span>
      {format && (
        <span className="jp-sans text-ink/40" lang="ja">
          {format.jp}
        </span>
      )}
    </p>
  );
}

export function QuestionStem({
  q,
  furigana,
  scriptUrl,
}: {
  q: QuestionView;
  furigana: boolean;
  scriptUrl: string | null;
}) {
  const leading = furigana ? "leading-[2.15]" : "leading-[1.85]";
  return (
    <div className="space-y-5">
      {q.passage && (
        <div className="rounded-md bg-sunken/70 p-4 sm:p-5">
          {q.passage.split(/\n/).map((line, i) => (
            <Ruby key={i} as="p" text={line} furigana={furigana} className={`jp text-[1.05rem] sm:text-[1.1rem] ${leading}`} />
          ))}
        </div>
      )}
      {q.hasAudio && scriptUrl && (
        <ListeningPlayer scriptUrl={scriptUrl} revealedScript={q.audioScript} furigana={furigana} />
      )}
      <Ruby as="p" text={q.prompt} furigana={furigana} className={`jp text-[1.3rem] sm:text-[1.55rem] ${leading}`} />
    </div>
  );
}
