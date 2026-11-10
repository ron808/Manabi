"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMounted } from "@/lib/client/useMounted";
import { ArrowRight } from "lucide-react";
import { Hanamaru } from "@/components/ui/Mark";
import { api, ApiClientError, saveSetting } from "@/lib/client/api";
import { localVerdict } from "@/lib/client/localGrade";
import type { QuestionView } from "@/lib/domain/question";
import { plainText } from "@/lib/ja/ruby";
import type { ReviewCard, ReviewReveal } from "@/lib/server/reviews";
import { ChoiceList } from "./question/ChoiceList";
import { Explanation } from "./question/Explanation";
import { QuestionLabel, QuestionStem } from "./question/QuestionStem";
import { TypedAnswer } from "./question/TypedAnswer";
import { useGenerate } from "./useGenerate";

type Rating = "hard" | "good" | "easy";

function whenBack(iso: string | null): string {
  if (!iso) return "soon";
  const hours = (new Date(iso).getTime() - Date.now()) / 3_600_000;
  if (hours < 1) return "in a few minutes";
  if (hours < 20) return "later today";
  if (hours < 36) return "tomorrow";
  return `in ${Math.round(hours / 24)} days`;
}

export function ReviewSession({ cards, furiganaDefault }: { cards: ReviewCard[]; furiganaDefault: boolean }) {
  const [queue, setQueue] = useState<ReviewCard[]>(cards);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState<ReviewReveal | null>(null);
  /** Marked on the device while the server's answer is on its way. */
  const [provisional, setProvisional] = useState<QuestionView | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [furigana, setFurigana] = useState(furiganaDefault);
  const [tally, setTally] = useState({ done: 0, right: 0 });
  const [againInSession, setAgainInSession] = useState(false);
  const requeued = useRef(new Set<string>());
  const mounted = useMounted();
  const { start, overlay, busy: generating } = useGenerate();

  const card = queue[index];
  const finished = index >= queue.length;

  async function answer(response: { choice: number } | { text: string }) {
    if (busy || reveal) return;
    setBusy(true);
    setError(null);
    if ("choice" in response) setPicked(response.choice);
    const request = api<ReviewReveal>(`/api/reviews/${card.id}/answer`, { body: response });
    const local = await localVerdict(card.question, response);
    if (local) {
      setProvisional({
        ...card.question,
        answered: true,
        revealed: true,
        userChoice: "choice" in response ? response.choice : null,
        userText: "text" in response ? response.text : null,
        isCorrect: local.isCorrect,
        answerIndex: local.answerIndex,
      });
    }
    try {
      const res = await request;
      setReveal(res);
      setProvisional(null);
      setTally((t) => ({ done: t.done + 1, right: t.right + (res.isCorrect ? 1 : 0) }));
      // A miss comes back once more at the end of this session.
      const requeue = !res.isCorrect && !requeued.current.has(card.id);
      if (requeue) {
        requeued.current.add(card.id);
        setQueue((q) => [...q, card]);
      }
      setAgainInSession(requeue);
    } catch (err) {
      setPicked(null);
      setProvisional(null);
      setError(err instanceof ApiClientError ? err.message : "Couldn't check that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function next(rating?: Rating) {
    if (rating) {
      setBusy(true);
      try {
        await api(`/api/reviews/${card.id}/grade`, { body: { rating } });
      } catch (err) {
        setBusy(false);
        setError(err instanceof ApiClientError ? err.message : "Couldn't save that. Try again.");
        return;
      }
      setBusy(false);
    }
    setReveal(null);
    setProvisional(null);
    setPicked(null);
    setError(null);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Keyboard: 1–4 answer; after a reveal, Enter = Good (or Next).
  const latest = useRef({ card, reveal, answer, next });
  latest.current = { card, reveal, answer, next };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea") || e.metaKey || e.ctrlKey) return;
      const s = latest.current;
      if (!s.card) return;
      if (!s.reveal && /^[1-4]$/.test(e.key) && s.card.question.options.length) {
        e.preventDefault();
        void s.answer({ choice: Number(e.key) - 1 });
      } else if (s.reveal && e.key === "Enter") {
        e.preventDefault();
        void s.next(s.reveal.isCorrect ? "good" : undefined);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (finished) {
    const pct = tally.done ? Math.round((tally.right / tally.done) * 100) : 0;
    return (
      <div className="sheet grid-paper mx-auto max-w-xl p-6 text-center sm:p-10">
        {overlay}
        <div className="mx-auto w-fit">
          <Hanamaru size={88} />
        </div>
        <h2 className="mt-4 font-serif text-[2.4rem] font-normal leading-none">Review done</h2>
        <p className="mt-3 text-ink/70">
          <span className="tabular">{tally.done}</span> answered · <span className="tabular">{pct}%</span> right first time.
          Misses come back soon; the rest are spaced out further each time.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            disabled={generating}
            onClick={() => void start({ kind: "daily" }, "Writing today's new questions")}
            className="btn btn-primary"
          >
            Continue with new questions <ArrowRight size={16} aria-hidden />
          </button>
          <Link href="/today" className="btn btn-quiet">
            Back to Today
          </Link>
        </div>
      </div>
    );
  }

  const q = reveal ? reveal.question : provisional ?? card.question;
  const original =
    reveal && reveal.original.choice != null
      ? plainText(card.question.options[reveal.original.choice] ?? "")
      : reveal?.original.text ?? null;

  return (
    <div className="mx-auto max-w-3xl">
      {overlay}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-ink/60">
          Card <span className="tabular font-medium text-ink">{Math.min(index + 1, queue.length)}</span> of{" "}
          <span className="tabular">{queue.length}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setFurigana(!furigana);
            saveSetting({ furigana: !furigana });
          }}
          aria-pressed={furigana}
          className="chip !min-h-[36px] !px-3 !text-[0.8rem]"
        >
          <span className="jp-sans">ふりがな</span>
        </button>
      </div>
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-ink/[0.08]">
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

              <motion.article
          key={`${card.id}-${index}`}
          initial={mounted.current ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="sheet p-5 sm:p-8"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <QuestionLabel q={q} />
            <span className="shrink-0 text-xs text-ink/50">
              {card.level}
              {card.lapses > 0 ? ` · missed ${card.lapses + 1}×` : ""}
            </span>
          </div>
          <QuestionStem q={q} furigana={furigana} scriptUrl={`/api/reviews/${card.id}/audio`} />
          <div className="mt-7">
            {q.typed ? (
              <TypedAnswer key={`${card.id}-${index}`} q={q} pending={busy && !q.revealed} onSubmit={(text) => void answer({ text })} />
            ) : (
              <ChoiceList
                q={q}
                furigana={furigana}
                selected={reveal ? reveal.question.userChoice : picked}
                pending={busy && !q.revealed}
                onChoose={(i) => void answer({ choice: i })}
                disabled={busy || !!reveal}
              />
            )}
          </div>

          {reveal && (
            <div className="mt-7 space-y-5">
              {original && (
                <p className="text-sm text-ink/60">
                  Last time you answered <span className="jp-sans font-medium text-ink">{original}</span>.
                </p>
              )}
              <Explanation q={reveal.question} furigana={furigana} tutorUrl={`/api/papers/${card.paperId}/questions/${card.questionId}/explain`} />
            </div>
          )}
        </motion.article>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-accent/10 px-4 py-3 text-sm text-accent-ink">
          {error}
        </p>
      )}

      {reveal && (
        <div className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] z-20 -mx-gutter mt-5 border-t border-ink/10 bg-ground/92 px-gutter py-3 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          {reveal.isCorrect && reveal.intervals ? (
            <div>
              <p className="mb-2 text-sm text-ink/60">How did that feel?</p>
              <div className="grid grid-cols-3 gap-2">
                {(["hard", "good", "easy"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={busy}
                    onClick={() => void next(r)}
                    className={`btn flex-col !gap-0.5 !py-2.5 ${r === "good" ? "btn-ink" : "btn-quiet"}`}
                  >
                    <span className="capitalize">{r}</span>
                    <span className="text-xs font-normal opacity-65">again in {reveal.intervals![r]}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-ink/60">
                {againInSession ? "One more try at the end of this session, then it's back " : "It's back "}
                {whenBack(reveal.scheduledFor)}.
              </p>
              <button type="button" onClick={() => void next()} className="btn btn-ink">
                Next <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
