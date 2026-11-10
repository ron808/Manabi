"use client";

import { Hanamaru } from "@/components/ui/Mark";

/** The score as a teacher would write it, with a 花丸 for excellent work. */
export function ScoreMark({ score, total }: { score: number; total: number }) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const excellent = pct >= 90;
  return (
    <div className="relative flex items-center gap-5">
      {excellent && <Hanamaru size={104} className="-my-2 shrink-0" />}
      <div>
        <p className="font-serif text-[clamp(4rem,14vw,6.5rem)] leading-[0.85] tracking-[-0.03em] text-accent-ink tabular">
          {score}
          <span className="text-[0.45em] text-ink/40">/{total}</span>
        </p>
        <p className="mt-2 text-sm text-ink/60">
          <span className="tabular">{pct}%</span>
          {excellent ? " · 花丸 — excellent" : pct >= 70 ? " · well done" : pct >= 50 ? " · getting there" : " · plenty to learn from"}
        </p>
      </div>
    </div>
  );
}
