"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { beginNavigation } from "@/components/ui/NavCurtain";
import { Seal } from "@/components/ui/Seal";
import { TraditionalCloud } from "@/components/ui/TraditionalCloud";
import { ApiClientError } from "@/lib/client/api";
import { JAPANESE_FACTS, factDuration, shuffled, type Fact } from "@/lib/ui/facts";
import type { GenerateRequest } from "@/lib/validation/schemas";

type State =
  | { phase: "idle" }
  | { phase: "running"; done: number; total: number; label: string }
  | { phase: "error"; message: string; label: string };

const LINES = [
  "Choosing what to test…",
  "Writing the questions…",
  "Picking tempting wrong answers…",
  "Adding furigana…",
  "Checking every answer twice…",
];

/**
 * Starts paper generation and shows live progress. The server streams
 * newline-delimited JSON events; on "done" we go straight to the paper.
 */
export function useGenerate() {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "idle" });
  const last = useRef<{ body: GenerateRequest; label: string } | null>(null);
  const abort = useRef<AbortController | null>(null);

  const start = useCallback(
    async (body: GenerateRequest, label = "Writing your paper") => {
      last.current = { body, label };
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setState({ phase: "running", done: 0, total: "questionCount" in body ? body.questionCount ?? 10 : 10, label });

      try {
        const res = await fetch("/api/papers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          let message = "Couldn't start the paper. Try again.";
          try {
            message = (await res.json())?.error?.message ?? message;
          } catch {
            // ignore
          }
          if (res.status === 401) window.location.href = "/login?reason=expired";
          throw new ApiClientError(message, res.status, "start_failed");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            const event = JSON.parse(line) as
              | { type: "progress"; done: number; total: number }
              | { type: "done"; paperId: string }
              | { type: "error"; message: string };
            if (event.type === "progress") {
              setState({ phase: "running", done: event.done, total: event.total, label });
            } else if (event.type === "done") {
              // The page-change clouds take over from the loader's clouds.
              beginNavigation(() => router.push(`/test/${event.paperId}`));
              return;
            } else {
              throw new ApiClientError(event.message, 502, "generation_failed");
            }
          }
        }
        throw new ApiClientError("The connection dropped before the paper was ready. Try again.", 0, "dropped");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({
          phase: "error",
          label,
          message: err instanceof ApiClientError ? err.message : "Couldn't reach Manabi. Check your connection and try again.",
        });
      }
    },
    [router]
  );

  const cancel = useCallback(() => {
    abort.current?.abort();
    setState({ phase: "idle" });
  }, []);

  const retry = useCallback(() => {
    if (last.current) void start(last.current.body, last.current.label);
  }, [start]);

  const overlay = <GenerationOverlay state={state} onCancel={cancel} onRetry={retry} />;
  return { start, overlay, busy: state.phase === "running" };
}

// Clouds from the top of the screen to the bottom, alternating sides. Each
// bobs at its own pace (see .gen-cloud in globals.css).
const CLOUDS = [
  { seed: 11, lobes: 5, top: "2%", side: "left", width: "clamp(272px, 62vw, 560px)", offset: "-8%", tone: 2, float: 7.2, delay: -1.1 },
  { seed: 23, lobes: 4, top: "8%", side: "right", width: "clamp(250px, 54vw, 480px)", offset: "-10%", tone: 1, float: 8.4, delay: -3.4 },
  { seed: 37, lobes: 3, top: "27%", side: "left", width: "clamp(250px, 44vw, 380px)", offset: "-12%", tone: 0, float: 6.6, delay: -2.2 },
  { seed: 41, lobes: 4, top: "33%", side: "right", width: "clamp(250px, 46vw, 420px)", offset: "-14%", tone: 2, float: 9.1, delay: -5.0 },
  { seed: 53, lobes: 4, top: "55%", side: "left", width: "clamp(250px, 52vw, 460px)", offset: "-10%", tone: 1, float: 7.8, delay: -0.6 },
  { seed: 67, lobes: 3, top: "62%", side: "right", width: "clamp(250px, 46vw, 400px)", offset: "-8%", tone: 0, float: 6.9, delay: -4.1 },
  { seed: 79, lobes: 5, top: "79%", side: "left", width: "clamp(290px, 66vw, 600px)", offset: "-6%", tone: 2, float: 8.8, delay: -2.8 },
  { seed: 83, lobes: 4, top: "84%", side: "right", width: "clamp(255px, 58vw, 520px)", offset: "-12%", tone: 1, float: 7.4, delay: -6.2 },
] as const;

const TONES = [
  { fill: "color-mix(in srgb, rgb(var(--accent)) 30%, rgb(var(--ground)))", line: "rgb(var(--accent) / 0.75)" },
  { fill: "color-mix(in srgb, rgb(var(--accent)) 62%, rgb(var(--ground)))", line: "rgb(var(--accent-ink))" },
  { fill: "rgb(var(--accent))", line: "rgb(var(--accent-ink))" },
];

/** Random facts in a shuffled cycle, each shown for 5–7s depending on its length. */
function useRotatingFact(active: boolean) {
  const order = useRef<Fact[]>([]);
  const [fact, setFact] = useState<Fact | null>(null);
  useEffect(() => {
    if (!active) return;
    let timer = 0;
    const show = () => {
      if (!order.current.length) order.current = shuffled(JAPANESE_FACTS);
      const next = order.current.pop()!;
      setFact(next);
      timer = window.setTimeout(show, factDuration(next));
    };
    show();
    return () => window.clearTimeout(timer);
  }, [active]);
  return fact;
}

function GenerationOverlay({ state, onCancel, onRetry }: { state: State; onCancel: () => void; onRetry: () => void }) {
  const [line, setLine] = useState(0);
  const running = state.phase === "running";
  const fact = useRotatingFact(state.phase !== "idle");

  useEffect(() => {
    if (!running) return;
    setLine(0);
    const id = window.setInterval(() => setLine((l) => Math.min(LINES.length - 1, l + 1)), 2600);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (state.phase === "idle") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state.phase]);

  if (state.phase === "idle") return null;

  return (
    <div className="gen-overlay" role="dialog" aria-modal="true" aria-labelledby="gen-title">
      <div className="grid-paper absolute inset-0 opacity-60" aria-hidden />
      {CLOUDS.map((c, i) => (
        <div
          key={c.seed}
          className="gen-cloud"
          style={
            {
              top: c.top,
              [c.side]: c.offset,
              width: c.width,
              "--cloud-fill": TONES[c.tone].fill,
              "--cloud-line": TONES[c.tone].line,
              "--float": `${c.float}s`,
              "--float-delay": `${c.delay}s`,
              "--enter-delay": `${i * 0.06}s`,
            } as React.CSSProperties
          }
        >
          <div className="gen-cloud-bob">
            <TraditionalCloud seed={c.seed} lobes={c.lobes} flip={c.side === "right"} className="block h-auto w-full" />
          </div>
        </div>
      ))}

      <div className="relative z-10 grid min-h-full place-items-center px-gutter py-10">
        <div className="gen-card sheet w-full max-w-md p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Seal size={34} />
            <p id="gen-title" className="text-sm font-medium text-ink/70">
              {state.label}
            </p>
          </div>

          {state.phase === "running" ? (
            <>
              <p className="mt-6 font-serif text-[2.4rem] leading-none tabular" aria-live="polite">
                {state.done < state.total ? (
                  <>
                    Question {Math.min(state.total, state.done + 1)}
                    <span className="text-ink/35"> of {state.total}</span>
                  </>
                ) : (
                  "Almost ready"
                )}
              </p>
              <p className="mt-2 text-sm text-ink/60">{LINES[line]}</p>
              <ol className="mt-6 grid grid-cols-10 gap-1.5" aria-hidden>
                {Array.from({ length: state.total }, (_, i) => (
                  <li
                    key={i}
                    className={`aspect-square rounded-[4px] transition-colors duration-500 ${
                      i < state.done ? "bg-accent" : "bg-ink/[0.08]"
                    }`}
                  />
                ))}
              </ol>
            </>
          ) : (
            <>
              <p className="mt-6 text-lg font-semibold">That paper didn&apos;t come together.</p>
              <p className="mt-2 text-sm text-ink/70" role="alert">
                {state.message}
              </p>
            </>
          )}

          {fact && (
            <div key={fact.text} className="gen-fact mt-6 rounded-md bg-sunken/70 px-4 py-3.5" aria-live="polite">
              <p className="text-xs font-semibold text-accent-ink">
                <span className="jp-sans">豆知識</span> · Did you know?
              </p>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink/85">
                {fact.jp && (
                  <span className="jp mr-1.5 text-[1.08em] text-ink" lang="ja">
                    {fact.jp}
                  </span>
                )}
                {fact.text}
              </p>
            </div>
          )}

          {state.phase === "running" ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-ink/50">Usually 10–30 seconds.</p>
              <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
                Cancel
              </button>
            </div>
          ) : (
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={onRetry} className="btn btn-primary">
                Try again
              </button>
              <button type="button" onClick={onCancel} className="btn btn-quiet">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
