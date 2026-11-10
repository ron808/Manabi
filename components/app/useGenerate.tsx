"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Seal } from "@/components/ui/Seal";
import { ApiClientError } from "@/lib/client/api";
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
              router.push(`/test/${event.paperId}`);
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

function GenerationOverlay({ state, onCancel, onRetry }: { state: State; onCancel: () => void; onRetry: () => void }) {
  const [line, setLine] = useState(0);
  const running = state.phase === "running";
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

  return (
    <AnimatePresence>
      {state.phase !== "idle" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-ground/85 px-gutter backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gen-title"
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="sheet grid-paper w-full max-w-md overflow-hidden p-6 sm:p-8"
          >
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
                <div className="mt-6 flex items-center justify-between gap-3">
                  <p className="text-xs text-ink/50">Usually 10–30 seconds.</p>
                  <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </>
            ) : state.phase === "error" ? (
              <>
                <p className="mt-6 text-lg font-semibold">That paper didn&apos;t come together.</p>
                <p className="mt-2 text-sm text-ink/70" role="alert">
                  {state.message}
                </p>
                <div className="mt-6 flex gap-2">
                  <button type="button" onClick={onRetry} className="btn btn-primary">
                    Try again
                  </button>
                  <button type="button" onClick={onCancel} className="btn btn-quiet">
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
