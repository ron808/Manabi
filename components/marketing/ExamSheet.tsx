"use client";

import { useEffect, useState } from "react";
import { Batsu, Maru } from "@/components/ui/Mark";
import { Ruby } from "@/components/ui/Ruby";

const OPTIONS = ["を", "で", "へ", "が"];
const PICKED = 0;
const ANSWER = 1;

/**
 * A real question on exam paper. The text is server-rendered and readable
 * immediately; after hydration the red pen marks it — the site's signature.
 */
export function ExamSheet({ className = "", furigana = true }: { className?: string; furigana?: boolean }) {
  const [marked, setMarked] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMarked(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <figure className={`sheet relative p-5 sm:p-7 ${className}`} aria-label="A sample question, marked">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">
          <span className="tabular text-ink/80">問 7</span> · Grammar · <span className="jp-sans text-ink/40">文法形式の判断</span>
        </p>
        <span className="text-xs tabular text-ink/45">N5</span>
      </div>
      <Ruby
        as="p"
        text="{駅|えき}（　　）{友|とも}だちに{会|あ}いました。"
        furigana={furigana}
        className="jp mt-5 text-[1.45rem] leading-[2.2] sm:text-[1.65rem]"
      />
      <ol className="mt-5 grid grid-cols-2 gap-2.5">
        {OPTIONS.map((o, i) => (
          <li
            key={o}
            className={`relative flex min-h-[54px] items-center gap-3 rounded-md bg-ground/60 px-3.5 shadow-[inset_0_0_0_1px_rgb(var(--line)/0.12)] transition-opacity duration-500 ${
              marked && i !== ANSWER && i !== PICKED ? "opacity-50" : ""
            }`}
          >
            <span className="relative grid h-7 w-7 place-items-center rounded-full text-sm font-semibold tabular text-ink/70 shadow-[inset_0_0_0_1px_rgb(var(--line)/0.25)]">
              {i + 1}
            </span>
            <span className="jp text-xl">{o}</span>
            {marked && i === PICKED && <Batsu />}
            {marked && i === ANSWER && <Maru delay={0.45} />}
          </li>
        ))}
      </ol>
      <figcaption
        className={`mt-5 border-t border-ink/10 pt-4 text-sm leading-relaxed text-ink/70 transition-opacity duration-700 ${
          marked ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="font-medium text-accent-ink">で</span> marks where an action happens — you met your friend{" "}
        <em>at</em> the station. を would make the station the thing you met.
      </figcaption>
    </figure>
  );
}
