"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, Snail } from "lucide-react";
import { Ruby } from "@/components/ui/Ruby";
import { api } from "@/lib/client/api";
import { useJapaneseSpeech } from "@/lib/ja/speech";

/**
 * Plays a listening question. The script is fetched in the background as the
 * question appears (never in the page HTML), so a tap can start speech
 * immediately — iOS only allows speech that begins inside the tap itself.
 * It is shown as text only after the question is answered, or when the
 * device has no Japanese voice.
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
  const { ready, available, speaking, blocked, speak, stop } = useJapaneseSpeech();
  const [script, setScript] = useState<string | null>(revealedScript);
  const [error, setError] = useState<string | null>(null);
  const [plays, setPlays] = useState(0);
  const loading = useRef<Promise<string> | null>(null);

  function getScript(): Promise<string> {
    if (script) return Promise.resolve(script);
    loading.current ??= api<{ script: string }>(scriptUrl).then((res) => {
      setScript(res.script);
      return res.script;
    });
    return loading.current;
  }

  useEffect(() => {
    getScript().catch(() => {
      loading.current = null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptUrl]);

  function play(rate?: number) {
    setError(null);
    if (speaking) return stop();
    const say = (s: string) => {
      if (speak(s, rate ? { rate } : undefined)) setPlays((n) => n + 1);
      else setError("Couldn't start the audio. Check your volume and try again.");
    };
    // Usually already loaded, so speech starts inside this tap.
    if (script) return say(script);
    getScript()
      .then(say)
      .catch(() => {
        loading.current = null;
        setError("Couldn't load the audio. Try again.");
      });
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
            <button type="button" disabled={!ready} onClick={() => play()} className="btn btn-ink btn-sm">
              {speaking ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {speaking ? "Stop" : plays ? "Play again" : "Play"}
            </button>
            <button
              type="button"
              disabled={!ready || speaking}
              onClick={() => play(0.7)}
              className="btn btn-quiet btn-sm"
              aria-label="Play slowly"
            >
              <Snail size={16} aria-hidden /> Slower
            </button>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-accent-ink">{error}</p>}
      {blocked && !error && <p className="mt-2 text-sm text-ink/70">Your browser paused the audio. Tap Play again to hear it.</p>}
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
