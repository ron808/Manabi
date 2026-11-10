"use client";

import { useEffect, useRef, useState } from "react";
import { Batsu, Maru } from "@/components/ui/Mark";

const STEPS = [
  {
    jp: "選ぶ",
    title: "Pick a level. Or don't.",
    body: "Choose N5 to N1, the question types, practice or exam conditions. Or press one button and Manabi picks today's mix from what you've been getting wrong.",
  },
  {
    jp: "作る",
    title: "A fresh paper, written for you",
    body: "Every paper is new: real JLPT question types, furigana where you want it, audio for listening. A second model answers every question blind, and anything it disagrees with is thrown away.",
  },
  {
    jp: "採点",
    title: "Marked like a teacher would",
    body: "Practice marks as you go, with a short why after every answer. Exam mode waits until you hand in. Stuck on a why? Ask the tutor about that exact question.",
  },
  {
    jp: "復習",
    title: "Your mistakes come back",
    body: "Every miss joins your review deck and returns just before you'd forget it — then further apart each time you get it right.",
  },
];

function Visual({ step }: { step: number }) {
  return (
    <div className="sheet grid-paper relative w-full overflow-hidden p-5 sm:p-8 lg:aspect-[4/3]">
      {/* Height comes from the tallest state on phones; fixed ratio on desktop. */}
      <div className="grid h-full">
        {/* All four states share one cell so the frame never changes height. */}
        <div className={`col-start-1 row-start-1 transition-opacity duration-500 ${step === 0 ? "opacity-100 delay-150" : "pointer-events-none opacity-0"}`}>
          <p className="eyebrow">Level</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {["N5", "N4", "N3", "N2", "N1"].map((l) => (
              <span key={l} className={`grid h-14 place-items-center rounded-md text-lg font-semibold ${l === "N3" ? "bg-ink text-ground" : "bg-surface shadow-[inset_0_0_0_1px_rgb(var(--line)/0.12)]"}`}>
                {l}
              </span>
            ))}
          </div>
          <p className="eyebrow mt-6">Question types</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Kanji reading", "Word in context", "Grammar form", "Sentence order ★", "Short passage", "Key point"].map((f, i) => (
              <span key={f} data-on={i !== 4} className="chip !min-h-[34px] !text-[0.8rem]">
                {f}
              </span>
            ))}
          </div>
        </div>
        <div className={`col-start-1 row-start-1 flex flex-col justify-center transition-opacity duration-500 ${step === 1 ? "opacity-100 delay-150" : "pointer-events-none opacity-0"}`}>
          <p className="font-serif text-[2.6rem] leading-none tabular">
            Question 9<span className="text-ink/35"> of 15</span>
          </p>
          <p className="mt-2 text-sm text-ink/60">Checking every answer twice…</p>
          <div className="mt-6 grid grid-cols-10 gap-1.5">
            {Array.from({ length: 15 }, (_, i) => (
              <span key={i} className={`aspect-square rounded-[4px] ${i < 8 ? "bg-accent" : "bg-ink/[0.08]"}`} />
            ))}
          </div>
        </div>
        <div className={`col-start-1 row-start-1 flex flex-col justify-center transition-opacity duration-500 ${step === 2 ? "opacity-100 delay-150" : "pointer-events-none opacity-0"}`}>
          <p className="jp text-[1.5rem] leading-[2]">
            <ruby>
              日本語<rt>にほんご</rt>
            </ruby>
            が
            <ruby>
              話<rt>はな</rt>
            </ruby>
            せる（　　）、
            <ruby>
              毎日<rt>まいにち</rt>
            </ruby>
            <ruby>
              練習<rt>れんしゅう</rt>
            </ruby>
            しています。
          </p>
          <div className="mt-4 grid gap-2">
            {["ために", "ように"].map((o, i) => (
              <span key={o} className="relative flex min-h-[48px] items-center gap-3 rounded-md bg-surface px-3.5 shadow-[inset_0_0_0_1px_rgb(var(--line)/0.12)]">
                <span className="grid h-7 w-7 place-items-center rounded-full text-sm font-semibold text-ink/70 shadow-[inset_0_0_0_1px_rgb(var(--line)/0.25)]">{i + 1}</span>
                <span className="jp text-lg">{o}</span>
                {step === 2 && (i === 0 ? <Batsu delay={0.2} /> : <Maru delay={0.55} />)}
              </span>
            ))}
          </div>
        </div>
        <div className={`col-start-1 row-start-1 flex flex-col justify-center transition-opacity duration-500 ${step === 3 ? "opacity-100 delay-150" : "pointer-events-none opacity-0"}`}>
          <p className="jp-sans text-xl font-medium">〜ように — so that</p>
          <p className="text-sm text-ink/55">Missed on Monday</p>
          <ol className="mt-6 grid grid-cols-4 gap-2 text-center">
            {[
              ["Tue", "1 day"],
              ["Fri", "3 days"],
              ["+8d", "a week"],
              ["+3w", "learned"],
            ].map(([d, l], i) => (
              <li key={d} className="rounded-md bg-surface px-1 py-3 shadow-[inset_0_0_0_1px_rgb(var(--line)/0.12)]">
                <span className={`mx-auto mb-2 block h-2.5 w-2.5 rounded-full ${i === 3 ? "bg-ink" : "bg-accent"}`} />
                <span className="block text-sm font-semibold tabular">{d}</span>
                <span className="block text-xs text-ink/55">{l}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Desktop: the visual sticks while the four steps scroll past, and changes
 * with whichever step is in the middle of the screen. Phones: a swipe strip.
 */
export function Steps() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  // The step nearest the middle of the screen is active. Measured on scroll
  // (not by intersection), so a fast fling can't skip a step.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.height === 0) return;
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div className="hidden gap-16 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="sticky top-[calc(50svh-15rem)] h-fit">
          <Visual step={active} />
        </div>
        <ol className="py-[18svh]">
          {STEPS.map((s, i) => (
            <li
              key={s.jp}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-step={i}
              className={`flex min-h-[46svh] flex-col justify-center transition-opacity duration-500 ${active === i ? "opacity-100" : "opacity-35"}`}
            >
              <p className="jp text-2xl text-accent-ink">{s.jp}</p>
              <h3 className="mt-2 text-3xl">{s.title}</h3>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-ink/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <ol className="scrollbar-none -mx-gutter flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-gutter px-gutter pb-2 lg:hidden">
        {STEPS.map((s, i) => (
          <li key={s.jp} className="w-[86%] shrink-0 snap-start sm:w-[60%]">
            <Visual step={i} />
            <p className="jp mt-5 text-xl text-accent-ink">{s.jp}</p>
            <h3 className="mt-1 text-2xl">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-ink/70">{s.body}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
