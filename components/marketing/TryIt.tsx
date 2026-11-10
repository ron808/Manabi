"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { KanaInput } from "@/components/ui/KanaInput";
import { Ruby } from "@/components/ui/Ruby";
import { useJapaneseSpeech } from "@/lib/ja/speech";

const SENTENCE = "{明日|あした}、{駅|えき}の{前|まえ}で{友達|ともだち}と{会|あ}います。";

/** Three things the app does to Japanese text, live, with no account. */
export function TryIt() {
  const [furigana, setFurigana] = useState(true);
  const [typed, setTyped] = useState("");
  const { ready, available, speaking, speak, stop } = useJapaneseSpeech();
  const match = typed.replace(/\s/g, "") === "ともだち";

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14">
      <div className="sheet grid-paper p-6 sm:p-10">
        <Ruby
          as="p"
          text={SENTENCE}
          furigana={furigana}
          className="jp text-[clamp(1.5rem,4.6vw,2.25rem)] leading-[2.15]"
        />
        <p className="mt-3 text-ink/60">Tomorrow I&apos;m meeting a friend in front of the station.</p>
        <div className="mt-7 flex flex-wrap gap-2">
          <button type="button" onClick={() => setFurigana((f) => !f)} aria-pressed={furigana} className="chip">
            <span className="jp-sans">ふりがな</span> {furigana ? "on" : "off"}
          </button>
          {ready && available ? (
            <button type="button" onClick={() => (speaking ? stop() : speak(SENTENCE, { rate: 0.9 }))} className="chip" aria-pressed={speaking}>
              {speaking ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />} Listen
            </button>
          ) : ready ? (
            <span className="chip opacity-60" title="This device has no Japanese voice">
              <Play size={15} aria-hidden /> No Japanese voice here
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col justify-center">
        <p className="eyebrow">No Japanese keyboard? No problem.</p>
        <p className="mt-2 text-lg leading-relaxed text-ink/80">
          Type <span className="font-mono text-[0.95em]">tomodachi</span> — it turns into kana as you go.
        </p>
        <div className="mt-5">
          <KanaInput value={typed} onChange={setTyped} placeholder="tomodachi" />
        </div>
        <p className="mt-3 h-6 text-sm text-ink/70" aria-live="polite">
          {match ? (
            <>
              <span className="font-medium text-accent-ink">◯</span> 友達 — friend. That&apos;s how recall questions feel.
            </>
          ) : typed ? (
            "Keep going…"
          ) : null}
        </p>
      </div>
    </div>
  );
}
