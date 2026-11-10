"use client";

import { useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { ApiClientError, streamText } from "@/lib/client/api";
import type { TutorTurn } from "@/lib/domain/question";

/** "Ask why": a short follow-up conversation about one graded question. */
export function TutorChat({
  url,
  initial,
  suggestions,
}: {
  url: string;
  initial: TutorTurn[];
  suggestions: string[];
}) {
  const [turns, setTurns] = useState<TutorTurn[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(initial.length > 0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function ask(message: string) {
    const m = message.trim();
    if (!m || busy) return;
    setError(null);
    setBusy(true);
    setInput("");
    setTurns((t) => [...t, { role: "user", content: m }, { role: "assistant", content: "" }]);
    try {
      for await (const chunk of streamText(url, { message: m })) {
        setTurns((t) => {
          const next = t.slice();
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }
    } catch (err) {
      setTurns((t) => t.slice(0, -2));
      setInput(m);
      setError(err instanceof ApiClientError ? err.message : "The tutor couldn't answer. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="btn btn-quiet btn-sm"
      >
        <Sparkles size={15} aria-hidden /> Ask why
      </button>
    );
  }

  return (
    <div className="rounded-md bg-sunken/60 p-3 sm:p-4">
      <p className="eyebrow mb-2 flex items-center gap-1.5">
        <Sparkles size={13} aria-hidden /> Ask the tutor about this question
      </p>
      {turns.length > 0 && (
        <div className="mb-3 space-y-3" aria-live="polite">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <p key={i} className="ml-auto w-fit max-w-[85%] rounded-md bg-ink px-3 py-2 text-sm text-ground">
                {t.content}
              </p>
            ) : (
              <p key={i} className="max-w-prose whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink/90">
                {t.content || <span className="text-ink/45">Thinking…</span>}
              </p>
            )
          )}
        </div>
      )}
      {turns.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => void ask(s)} className="chip !min-h-[36px] !text-[0.8rem]">
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void ask(input);
            }
          }}
          rows={1}
          placeholder="Why is it で and not に?"
          className="field min-h-[44px] flex-1 resize-none !py-2.5"
          aria-label="Your question"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn btn-ink !px-3" aria-label="Ask">
          <ArrowUp size={18} aria-hidden />
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-accent-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
