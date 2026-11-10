"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiClientError } from "@/lib/client/api";
import { LEVELS } from "@/lib/domain/jlpt";
import type { PaperSummary } from "@/lib/server/papers";
import { PaperRow } from "./PaperRow";

type Page = { papers: PaperSummary[]; nextCursor: string | null };

export function HistoryList({ initial }: { initial: Page }) {
  const [papers, setPapers] = useState(initial.papers);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [level, setLevel] = useState<string | null>(null);
  const [mode, setMode] = useState<"practice" | "exam" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef(true);

  async function load(reset: boolean) {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams();
    if (level) sp.set("level", level);
    if (mode) sp.set("mode", mode);
    if (!reset && cursor) sp.set("before", cursor);
    try {
      const page = await api<Page>(`/api/papers?${sp}`);
      setPapers((prev) => (reset ? page.papers : [...prev, ...page.papers]));
      setCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't load your papers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, mode]);

  return (
    <div className="space-y-5">
      <div className="scrollbar-none -mx-gutter flex gap-2 overflow-x-auto px-gutter">
        <button type="button" data-on={!level && !mode} onClick={() => { setLevel(null); setMode(null); }} className="chip shrink-0">
          All
        </button>
        {LEVELS.map((l) => (
          <button key={l} type="button" data-on={level === l} onClick={() => setLevel(level === l ? null : l)} className="chip shrink-0 tabular">
            {l}
          </button>
        ))}
        <span aria-hidden className="mx-1 w-px shrink-0 bg-ink/10" />
        <button type="button" data-on={mode === "exam"} onClick={() => setMode(mode === "exam" ? null : "exam")} className="chip shrink-0">
          Exams
        </button>
        <button type="button" data-on={mode === "practice"} onClick={() => setMode(mode === "practice" ? null : "practice")} className="chip shrink-0">
          Practice
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-accent/10 px-4 py-3 text-sm text-accent-ink">
          {error}
        </p>
      )}
      {papers.length === 0 && !loading ? (
        <p className="panel p-8 text-center text-ink/60">No papers match.</p>
      ) : (
        <ul className={`panel p-1.5 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {papers.map((p) => (
            <PaperRow key={p.id} p={p} />
          ))}
        </ul>
      )}
      {cursor && (
        <div className="text-center">
          <button type="button" onClick={() => void load(false)} disabled={loading} className="btn btn-quiet">
            {loading ? "Loading…" : "Show more"}
          </button>
        </div>
      )}
    </div>
  );
}
