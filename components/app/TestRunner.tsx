"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMounted } from "@/lib/client/useMounted";
import { beginNavigation, cancelNavigation } from "@/components/ui/NavCurtain";
import { ArrowLeft, ArrowRight, Bookmark, Clock, X } from "lucide-react";
import { api, ApiClientError, saveSetting } from "@/lib/client/api";
import { localVerdict } from "@/lib/client/localGrade";
import type { QuestionView } from "@/lib/domain/question";
import type { PaperView } from "@/lib/server/papers";
import { ChoiceList } from "./question/ChoiceList";
import { Explanation } from "./question/Explanation";
import { QuestionLabel, QuestionStem } from "./question/QuestionStem";
import { TypedAnswer } from "./question/TypedAnswer";

type AnswerResponse = { question: QuestionView };

function formatClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return h ? `${h}:${mm}:${String(r).padStart(2, "0")}` : `${mm}:${String(r).padStart(2, "0")}`;
}

export function TestRunner({ paper, furiganaDefault }: { paper: PaperView; furiganaDefault: boolean }) {
  const router = useRouter();
  const exam = paper.mode === "exam";
  const [questions, setQuestions] = useState<QuestionView[]>(paper.questions);
  const [current, setCurrent] = useState(() => {
    const i = paper.questions.findIndex((q) => !q.answered);
    return i === -1 ? 0 : i;
  });
  const [furigana, setFurigana] = useState(furiganaDefault);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [guessed, setGuessed] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [handingIn, setHandingIn] = useState(false);
  const [freshMarks, setFreshMarks] = useState<Set<number>>(new Set());
  const mounted = useMounted();

  const q = questions[current];
  const total = questions.length;
  const answeredCount = questions.filter((x) => x.answered).length;
  const unanswered = questions.map((x, i) => (!x.answered ? i + 1 : 0)).filter(Boolean);
  const flagged = questions.map((x, i) => (x.flagged ? i + 1 : 0)).filter(Boolean);
  const isLast = current === total - 1;

  // ── Timer (server clock, corrected for skew) ──────────────────────────────
  const skew = useRef(new Date(paper.serverNow).getTime() - Date.now());
  const deadline = paper.deadlineAt ? new Date(paper.deadlineAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [deadline]);
  const remaining = deadline ? deadline - (now + skew.current) : null;

  const handIn = useCallback(async () => {
    if (handingIn) return;
    setHandingIn(true);
    setError(null);
    beginNavigation();
    try {
      await api(`/api/papers/${paper.id}/complete`, { method: "POST" });
      beginNavigation(() => {
        router.replace(`/results/${paper.id}`);
        router.refresh();
      });
    } catch (err) {
      cancelNavigation();
      setHandingIn(false);
      setConfirming(false);
      setError(err instanceof ApiClientError ? err.message : "Couldn't hand the paper in. Try again.");
    }
  }, [handingIn, paper.id, router]);

  const expired = remaining != null && remaining <= 0;
  useEffect(() => {
    if (expired) void handIn();
  }, [expired, handIn]);

  // ── Answering ─────────────────────────────────────────────────────────────
  const patch = (id: number, next: Partial<QuestionView> | QuestionView) =>
    setQuestions((qs) => qs.map((x) => (x.id === id ? { ...x, ...next } : x)));

  async function submit(target: QuestionView, response: { choice: number } | { text: string }) {
    if (pending.has(target.id) || handingIn) return;
    const before = target;
    setError(null);
    setPending((s) => new Set(s).add(target.id));
    patch(target.id, {
      answered: true,
      userChoice: "choice" in response ? response.choice : null,
      userText: "text" in response ? response.text : null,
    });
    const wasGuess = guessed;
    // Practice mode: mark on the device straight away; the server's answer
    // (with the explanation) lands a moment later and has the final say.
    const request = api<AnswerResponse>(`/api/papers/${paper.id}/answers`, {
      body: { questionId: target.id, ...response, ...(exam ? {} : { guessed: wasGuess }) },
    });
    if (!exam) {
      const local = await localVerdict(target, response);
      if (local) {
        patch(target.id, { revealed: true, isCorrect: local.isCorrect, answerIndex: local.answerIndex, guessed: wasGuess });
        setFreshMarks((s) => new Set(s).add(target.id));
        setGuessed(false);
      }
    }
    try {
      const res = await request;
      patch(target.id, { ...res.question, flagged: before.flagged });
      if (res.question.revealed) setFreshMarks((s) => new Set(s).add(target.id));
      setGuessed(false);
    } catch (err) {
      patch(target.id, before);
      if (err instanceof ApiClientError && err.status === 410) {
        router.replace(`/results/${paper.id}`);
        router.refresh();
        return;
      }
      setError(err instanceof ApiClientError ? err.message : "Couldn't save that answer. Try again.");
    } finally {
      setPending((s) => {
        const n = new Set(s);
        n.delete(target.id);
        return n;
      });
    }
  }

  async function toggleFlag() {
    const next = !q.flagged;
    patch(q.id, { flagged: next });
    try {
      await api(`/api/papers/${paper.id}/questions/${q.id}`, { method: "PATCH", body: { flagged: next } });
    } catch {
      patch(q.id, { flagged: !next });
    }
  }

  const go = useCallback((i: number) => {
    setCurrent(Math.max(0, Math.min(total - 1, i)));
    setGuessed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [total]);

  function primaryAction() {
    if (isLast) {
      if (unanswered.length || exam) setConfirming(true);
      else void handIn();
    } else go(current + 1);
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const latest = useRef({ q, exam, current, go, submit, primaryAction, toggleFlag });
  latest.current = { q, exam, current, go, submit, primaryAction, toggleFlag };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable=true]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = latest.current;
      if (/^[1-4]$/.test(e.key) && s.q.options.length) {
        const i = Number(e.key) - 1;
        if (s.exam || !s.q.answered) void s.submit(s.q, { choice: i });
      } else if (e.key === "ArrowRight") s.go(s.current + 1);
      else if (e.key === "ArrowLeft") s.go(s.current - 1);
      else if (e.key === "Enter" && (s.q.answered || s.exam)) s.primaryAction();
      else if (e.key.toLowerCase() === "f") void s.toggleFlag();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function setFuri(v: boolean) {
    setFurigana(v);
    saveSetting({ furigana: v });
  }

  const scriptUrl = `/api/papers/${paper.id}/questions/${q.id}/audio`;
  const choiceLocked = !exam && q.answered;
  const lowTime = remaining != null && remaining < 120_000;

  const navigator = useMemo(
    () => (
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5" aria-label="Questions">
        {questions.map((x, i) => {
          const on = i === current;
          const state = x.revealed ? (x.isCorrect ? "right" : x.answered ? "wrong" : "blank") : x.answered ? "done" : "blank";
          return (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={on ? "step" : undefined}
                aria-label={`Question ${i + 1}${x.answered ? ", answered" : ""}${x.flagged ? ", flagged" : ""}`}
                className={`relative grid h-10 w-full place-items-center rounded-sm text-sm tabular transition-colors ${
                  state === "done" ? "bg-ink text-ground" : "bg-surface shadow-[inset_0_0_0_1px_rgb(var(--line)/0.14)]"
                } ${on ? "outline outline-2 outline-offset-2 outline-accent" : ""}`}
              >
                {i + 1}
                {state === "right" && <span aria-hidden className="absolute inset-1 rounded-full border-[1.5px] border-accent" />}
                {state === "wrong" && (
                  <span aria-hidden className="absolute inset-0 grid place-items-center text-xl leading-none text-accent">
                    ×
                  </span>
                )}
                {x.flagged && <span aria-hidden className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />}
              </button>
            </li>
          );
        })}
      </ol>
    ),
    [questions, current, go]
  );

  return (
    <div className="mx-auto max-w-page">
      {/* Paper bar */}
      <div className="sticky top-14 z-30 -mx-gutter mb-5 border-b border-ink/10 bg-ground/92 px-gutter py-2.5 backdrop-blur-md md:top-16 lg:static lg:mx-0 lg:mb-8 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/today" className="btn btn-ghost btn-sm !px-2" aria-label="Save and exit">
              <X size={18} aria-hidden />
              <span className="hidden sm:inline">Save and exit</span>
            </Link>
            <p className="truncate text-sm text-ink/65">
              <span className="font-medium text-ink">{paper.config.level}</span> · {exam ? "Exam" : "Practice"} ·{" "}
              <span className="tabular">
                {answeredCount}/{total}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFuri(!furigana)}
              aria-pressed={furigana}
              className="chip !min-h-[36px] !px-3 !text-[0.8rem]"
              title="Show readings above kanji"
            >
              <span className="jp-sans">ふりがな</span>
            </button>
            {remaining != null && (
              <span
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-sm font-medium tabular ${
                  lowTime ? "bg-accent text-on-accent" : "bg-ink/[0.06]"
                }`}
                role="timer"
                aria-label={`Time left ${formatClock(remaining)}`}
              >
                <Clock size={14} aria-hidden />
                {formatClock(remaining)}
              </span>
            )}
          </div>
        </div>
        <div className="mt-2.5 lg:hidden">
          <div className="scrollbar-none -mx-gutter flex gap-1.5 overflow-x-auto px-gutter">
            {questions.map((x, i) => (
              <button
                key={x.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Question ${i + 1}`}
                aria-current={i === current ? "step" : undefined}
                className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-sm text-[0.8rem] tabular ${
                  i === current
                    ? "bg-accent text-on-accent"
                    : x.answered && !x.revealed
                      ? "bg-ink text-ground"
                      : "bg-surface shadow-[inset_0_0_0_1px_rgb(var(--line)/0.14)]"
                }`}
              >
                {i + 1}
                {x.revealed && x.isCorrect && i !== current && (
                  <span aria-hidden className="absolute inset-[3px] rounded-full border-[1.5px] border-accent" />
                )}
                {x.revealed && x.isCorrect === false && x.answered && i !== current && (
                  <span aria-hidden className="absolute inset-0 grid place-items-center text-lg text-accent">×</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* Question */}
        <div className="min-w-0">
                      <motion.article
              key={q.id}
              initial={mounted.current ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="sheet p-5 sm:p-8"
              aria-labelledby={`q-${q.id}-label`}
            >
              <div className="mb-5 flex items-start justify-between gap-3" id={`q-${q.id}-label`}>
                <QuestionLabel q={q} index={current} />
                <button
                  type="button"
                  onClick={() => void toggleFlag()}
                  aria-pressed={q.flagged}
                  className={`btn btn-ghost btn-sm -mr-2 -mt-2 !px-2 ${q.flagged ? "!text-accent-ink" : ""}`}
                  title="Flag to come back to (F)"
                >
                  <Bookmark size={16} fill={q.flagged ? "currentColor" : "none"} aria-hidden />
                  <span className="hidden sm:inline">{q.flagged ? "Flagged" : "Flag"}</span>
                </button>
              </div>

              <QuestionStem q={q} furigana={furigana} scriptUrl={scriptUrl} />

              <div className="mt-7">
                {q.typed ? (
                  <TypedAnswer
                    key={q.id}
                    q={q}
                    pending={pending.has(q.id) && !q.revealed}
                    animateMarks={freshMarks.has(q.id)}
                    draft={drafts[q.id] ?? q.userText ?? ""}
                    onDraft={(v) => setDrafts((d) => ({ ...d, [q.id]: v }))}
                    onSubmit={(text) => void submit(q, { text })}
                    submitLabel={exam ? "Save answer" : "Check answer"}
                    disabled={choiceLocked}
                  />
                ) : (
                  <ChoiceList
                    q={q}
                    furigana={furigana}
                    selected={q.userChoice}
                    pending={pending.has(q.id) && !q.revealed}
                    onChoose={(i) => void submit(q, { choice: i })}
                    disabled={choiceLocked || pending.has(q.id)}
                    animateMarks={freshMarks.has(q.id)}
                  />
                )}
              </div>

              {!exam && !q.answered && (
                <label className="mt-5 inline-flex cursor-pointer items-center gap-2.5 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={guessed}
                    onChange={(e) => setGuessed(e.target.checked)}
                    className="h-[18px] w-[18px] accent-[rgb(var(--accent))]"
                  />
                  Not sure — review this later even if I get it right
                </label>
              )}

              {q.revealed && (
                <div className="mt-7">
                  <Explanation q={q} furigana={furigana} tutorUrl={`/api/papers/${paper.id}/questions/${q.id}/explain`} />
                </div>
              )}
              {exam && q.answered && (
                <p className="mt-5 text-sm text-ink/55">Saved. You can change it until you hand in.</p>
              )}
            </motion.article>

          {error && (
            <p role="alert" className="mt-4 rounded-md bg-accent/10 px-4 py-3 text-sm text-accent-ink">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="sticky bottom-0 z-20 -mx-gutter mt-5 border-t border-ink/10 bg-ground/92 px-gutter pb-safe pt-3 backdrop-blur-md lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="flex items-center justify-between gap-3 pb-3 lg:pb-0">
              <button type="button" onClick={() => go(current - 1)} disabled={current === 0} className="btn btn-quiet">
                <ArrowLeft size={16} aria-hidden /> <span className="hidden sm:inline">Previous</span>
              </button>
              {!isLast && (
                <button type="button" onClick={() => setConfirming(true)} disabled={handingIn} className="btn btn-ghost btn-sm lg:hidden">
                  {exam ? "Hand in" : "Finish"}
                </button>
              )}
              <p className="hidden text-xs text-ink/45 lg:block">
                <span className="kbd">1</span>–<span className="kbd">4</span> answer · <span className="kbd">←</span>
                <span className="kbd">→</span> move · <span className="kbd">F</span> flag
              </p>
              <button
                type="button"
                onClick={primaryAction}
                disabled={handingIn}
                className={`btn min-w-[8.5rem] ${isLast || q.answered ? "btn-primary" : "btn-quiet"}`}
              >
                {isLast ? (handingIn ? "Handing in…" : exam ? "Hand in" : "Finish") : q.answered || exam ? "Next" : "Skip"}
                {!isLast && <ArrowRight size={16} aria-hidden />}
              </button>
            </div>
          </div>
        </div>

        {/* Rail (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="panel p-4">
              <p className="mb-3 text-sm font-medium">
                <span className="tabular">{answeredCount}</span>
                <span className="text-ink/50"> of {total} answered</span>
              </p>
              {navigator}
            </div>
            <button type="button" onClick={() => setConfirming(true)} disabled={handingIn} className="btn btn-quiet w-full">
              {exam ? "Hand in paper" : "Finish now"}
            </button>
          </div>
        </aside>
      </div>

      {/* Hand-in confirmation */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid items-end bg-ink/30 p-gutter pb-[max(1rem,env(safe-area-inset-bottom))] sm:place-items-center"
            onClick={(e) => e.target === e.currentTarget && setConfirming(false)}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="handin-title"
              initial={{ y: 24 }}
              animate={{ y: 0 }}
              exit={{ y: 24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="sheet w-full max-w-md p-6"
            >
              <h2 id="handin-title" className="text-xl">
                {exam ? "Hand in your paper?" : "Finish this paper?"}
              </h2>
              <div className="mt-3 space-y-1.5 text-sm text-ink/75">
                {unanswered.length > 0 ? (
                  <p>
                    {unanswered.length} unanswered: <span className="tabular">{unanswered.slice(0, 12).join(", ")}{unanswered.length > 12 ? "…" : ""}</span>
                  </p>
                ) : (
                  <p>Every question has an answer.</p>
                )}
                {flagged.length > 0 && (
                  <p>
                    Flagged to check: <span className="tabular">{flagged.join(", ")}</span>
                  </p>
                )}
                {exam && <p>You won&apos;t be able to change answers after this.</p>}
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setConfirming(false)} className="btn btn-quiet">
                  Keep going
                </button>
                <button type="button" onClick={() => void handIn()} disabled={handingIn} className="btn btn-primary">
                  {handingIn ? "Handing in…" : exam ? "Hand in" : "Finish"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
