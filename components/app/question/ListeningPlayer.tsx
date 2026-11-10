"use client";

import { useState } from "react";
import { Headphones, Pause, Play, Snail } from "lucide-react";
import { Ruby } from "@/components/ui/Ruby";
import { api } from "@/lib/client/api";
import { useJapaneseSpeech } from "@/lib/ja/speech";

/**
 * Plays a listening question. The script is fetched only when play is
 * pressed, and shown as text only after the question is answered (or when the
 * device has no Japanese voice).
 */
export function ListeningPlayer({
  scriptUrl,
  revealedScript,
  furigana,
}: {
  scriptUrl: string;
  revealedScript: string | null;
  furigana: boolean;
}) {
  const { ready, available, speaking, speak, stop, unlock } = useJapaneseSpeech();
  const [script, setScript] = useState<string | null>(revealedScript);
  const [error, setError] = useState<string | null>(null);
  const [plays, setPlays] = useState(0);

  async function getScript() {
    if (script) return script;
    const res = await api<{ script: string }>(scriptUrl);
    setScript(res.script);
    return res.script;
  }

  async function play(rate?: number) {
    setError(null);
    if (speaking) return stop();
    unlock();
    try {
      const s = await getScript();
      speak(s, rate ? { rate } : undefined);
      setPlays((n) => n + 1);
    } catch {
      setError("Couldn't load the audio. Try again.");
    }
  }

  const noVoice = ready && !available;
  const showText = revealedScript ?? (noVoice ? script : null);

  return (
    <div className="rounded-md bg-sunken/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-ground" aria-hidden>
          <Headphones size={18} />
        </span>
        {noVoice ? (
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink/75">This device has no Japanese voice installed, so you&apos;ll read the script instead.</p>
            {!script && (
              <button type="button" onClick={() => void getScript()} className="link mt-1 text-sm">
                Show the script
              </button>
            )}
          </div>
        ) : (
          <>
            <button type="button" disabled={!ready} onClick={() => void play()} className="btn btn-ink btn-sm">
              {speaking ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {speaking ? "Stop" : plays ? "Play again" : "Play"}
            </button>
            <button
              type="button"
              disabled={!ready || speaking}
              onClick={() => void play(0.7)}
              className="btn btn-quiet btn-sm"
              aria-label="Play slowly"
            >
              <Snail size={16} aria-hidden /> Slower
            </button>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-accent-ink">{error}</p>}
      {showText && (
        <div className="mt-4 border-t border-ink/10 pt-3">
          <p className="eyebrow mb-1">Script</p>
          {showText.split(/\n+/).map((line, i) => (
            <Ruby key={i} as="p" text={line} furigana={furigana} className="jp text-[1.05rem] leading-[2.1]" />
          ))}
        </div>
      )}
    </div>
  );
}
