"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ChevronDown, Search } from "lucide-react";
import { api, ApiClientError } from "@/lib/client/api";
import { SECTIONS, type Section } from "@/lib/domain/jlpt";
import type { LibraryItem } from "@/lib/server/reviews";
import { relativeDay } from "./PaperRow";
import { ChoiceList } from "./question/ChoiceList";
import { Explanation } from "./question/Explanation";
import { QuestionLabel, QuestionStem } from "./question/QuestionStem";
import { TypedAnswer } from "./question/TypedAnswer";
import { Ruby } from "@/components/ui/Ruby";

type Page = { items: LibraryItem[]; nextCursor: string | null };

export function MistakeLibrary({ initial, furigana }: { initial: Page; furigana: boolean }) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [section, setSection] = useState<Section | null>(null);
  const [archived, setArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef(true);

  async function load(reset: boolean) {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams();
    if (section) sp.set("section", section);
    if (archived) sp.set("archived", "1");
    if (query.trim()) sp.set("q", query.trim());
    if (!reset && cursor) sp.set("before", cursor);
    try {
      const page = await api<Page>(`/api/reviews?${sp}`);
      setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
      setCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't load your mistakes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => void load(true), query ? 250 : 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, archived, query]);

  async function toggleArchive(item: LibraryItem) {
    setItems((list) => list.filter((x) => x.id !== item.id));
    try {
      await api(`/api/reviews/${item.id}`, { method: "PATCH", body: { archived: !item.archived } });
    } catch {
      setItems((list) => [item, ...list]);
      setError("Couldn't update that card.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by word, grammar point or translation"
            className="field !pl-10"
          />
        </label>
        <button type="button" onClick={() => setArchived((a) => !a)} aria-pressed={archived} className="chip shrink-0">
          <Archive size={15} aria-hidden /> Archived
        </button>
      </div>
      <div className="scrollbar-none -mx-gutter flex gap-2 overflow-x-auto px-gutter">
        <button type="button" data-on={section === null} onClick={() => setSection(null)} className="chip shrink-0">
          All
        </button>
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" data-on={section === s.id} onClick={() => setSection(s.id)} className="chip shrink-0">
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-accent/10 px-4 py-3 text-sm text-accent-ink">
          {error}
        </p>
      )}

      {items.length === 0 && !loading ? (
        <p className="panel p-8 text-center text-ink/60">
          {query || section ? "No mistakes match." : archived ? "Nothing archived." : "No mistakes yet. Lucky you — for now."}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <LibraryRow key={item.id} item={item} furigana={furigana} onArchive={() => void toggleArchive(item)} />
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

function LibraryRow({ item, furigana, onArchive }: { item: LibraryItem; furigana: boolean; onArchive: () => void }) {
  const [open, setOpen] = useState(false);
  const q = item.question;
  const due = new Date(item.due);
  const dueLabel = due.getTime() <= Date.now() ? "due now" : `next ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  return (
    <li className="panel">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-4 p-4 text-left sm:p-5">
        <span className="min-w-0 flex-1">
          <Ruby text={q.prompt} furigana={false} className="jp line-clamp-2 block text-[1.05rem] leading-snug" />
          <span className="mt-1.5 block text-sm text-ink/55">
            {q.point ? <span className="jp-sans text-ink/75">{q.point}</span> : null}
            {q.point ? " · " : ""}
            {item.level} · {relativeDay(item.createdAt)} · {dueLabel}
          </span>
        </span>
        <ChevronDown size={18} className={`mt-1 shrink-0 text-ink/40 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-ink/[0.07] p-4 sm:p-6">
          <div className="mb-4">
            <QuestionLabel q={q} />
          </div>
          <QuestionStem q={q} furigana={furigana} scriptUrl={`/api/reviews/${item.id}/audio`} />
          <div className="mt-5">
            {q.typed ? <TypedAnswer q={q} animateMarks={false} /> : <ChoiceList q={q} furigana={furigana} selected={q.userChoice} animateMarks={false} />}
          </div>
          <div className="mt-5">
            <Explanation q={q} furigana={furigana} tutorUrl={`/api/papers/${item.paperId}/questions/${q.id}/explain`} />
          </div>
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={onArchive} className="btn btn-ghost btn-sm">
              {item.archived ? <ArchiveRestore size={15} aria-hidden /> : <Archive size={15} aria-hidden />}
              {item.archived ? "Put back in the deck" : "I know this — archive"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
