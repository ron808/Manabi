"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Timer } from "@/components/test/Timer";
import { QuestionNavigator, type NavStatus } from "@/components/test/QuestionNavigator";
import { QuestionCard } from "@/components/test/QuestionCard";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import type { PaperFull } from "@/lib/types";

export default function TestPage() {
  const router = useRouter();
  const { paperId } = useParams<{ paperId: string }>();

  const [paper, setPaper] = useState<PaperFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  // Per-question correct answer revealed by API after answer submission
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const startedAtRef = useRef<number>(Date.now());

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/papers/${paperId}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load paper");
      setPaper(j.paper as PaperFull);
      // Pre-fill revealed for already-answered questions
      const prefilled: Record<number, string> = {};
      (j.paper.questions as PaperFull["questions"]).forEach((q) => {
        if (q.userAnswer != null && q.isCorrect != null) {
          prefilled[q.id] = q.correctAnswer;
        }
      });
      setRevealed(prefilled);
      // Jump to first unanswered, if any
      const idx = (j.paper.questions as PaperFull["questions"]).findIndex(
        (q) => q.userAnswer == null
      );
      setCurrent(idx === -1 ? 0 : idx);
      startedAtRef.current = j.paper.startedAt
        ? new Date(j.paper.startedAt).getTime()
        : Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load paper");
    }
  }, [paperId]);

  useEffect(() => {
    load();
  }, [load]);

  const completing = useRef(false);
  const complete = useCallback(async () => {
    if (completing.current) return;
    completing.current = true;
    try {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      await fetch(`/api/papers/${paperId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeTakenSeconds: elapsed }),
      });
      router.push(`/results/${paperId}`);
    } catch {
      completing.current = false;
      setError("Failed to submit paper. Try again.");
    }
  }, [paperId, router]);

  const submitAnswer = useCallback(
    async (questionId: number, value: string) => {
      if (!paper) return;
      // Optimistic update
      const next = {
        ...paper,
        questions: paper.questions.map((q) =>
          q.id === questionId
            ? { ...q, userAnswer: value, answeredAt: new Date().toISOString() }
            : q
        ),
      };
      setPaper(next);
      try {
        const res = await fetch(`/api/papers/${paperId}/answer`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, userAnswer: value }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Failed");
        setPaper((prev) =>
          prev
            ? {
                ...prev,
                questions: prev.questions.map((q) =>
                  q.id === questionId
                    ? { ...q, isCorrect: !!j.isCorrect }
                    : q
                ),
              }
            : prev
        );
        setRevealed((r) => ({ ...r, [questionId]: j.correctAnswer }));
      } catch {
        // Roll back optimistic mark
        setPaper((prev) =>
          prev
            ? {
                ...prev,
                questions: prev.questions.map((q) =>
                  q.id === questionId
                    ? { ...q, userAnswer: null, isCorrect: null }
                    : q
                ),
              }
            : prev
        );
        setError("Could not save your answer. Try again.");
      }
    },
    [paper, paperId]
  );

  const navStatuses = useMemo<NavStatus[]>(() => {
    if (!paper) return [];
    return paper.questions.map((q) => {
      if (q.isCorrect === true) return "correct";
      if (q.isCorrect === false) return "incorrect";
      return "unanswered";
    });
  }, [paper]);

  const totalSeconds = useMemo(() => {
    if (!paper?.config.timeLimitMinutes) return 0;
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    return Math.max(0, paper.config.timeLimitMinutes * 60 - elapsed);
  }, [paper]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <ErrorBanner message={error} onRetry={load} />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 pt-4">
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-40" />
      </div>
    );
  }

  const total = paper.questions.length;
  const q = paper.questions[current];
  const answered = paper.questions.filter((qq) => qq.userAnswer != null).length;
  const locked = q.userAnswer != null;
  const correctAnswer = revealed[q.id] ?? null;
  const timed = paper.config.timeLimitMinutes != null;
  const isLast = current === total - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="card rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-white/45">
              Navigator
            </div>
            <div className="mt-1 text-sm text-white/65">
              {answered} / {total} answered
            </div>
            <div className="mt-4">
              <QuestionNavigator
                total={total}
                current={current}
                statuses={navStatuses}
                onJump={setCurrent}
              />
            </div>
          </div>
          <Legend />
        </div>
      </aside>

      {/* Main */}
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm text-white/70">
              {paper.config.level} · diff {paper.config.difficulty}/5 · {total} questions
            </div>
            <div className="text-xs text-white/40">
              {paper.config.formats.slice(0, 4).join(" · ")}
              {paper.config.formats.length > 4 ? " · …" : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timed && totalSeconds > 0 && (
              <Timer
                totalSeconds={totalSeconds}
                onExpire={complete}
                paused={false}
              />
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-sakura-400 transition-[width] duration-300"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>

        {/* Mobile navigator */}
        <div className="lg:hidden">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {paper.questions.map((qq, i) => {
              const s = navStatuses[i];
              let cls =
                "h-9 w-9 shrink-0 rounded-lg text-xs font-medium ";
              if (s === "correct")
                cls += "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40";
              else if (s === "incorrect")
                cls += "bg-sakura-500/20 text-sakura-100 ring-1 ring-sakura-500/40";
              else cls += "bg-white/5 text-white/60";
              if (i === current)
                cls += " outline outline-2 outline-offset-2 outline-brand-400";
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={cls}
                  aria-label={`Jump to question ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <QuestionCard
              question={q}
              index={current}
              total={total}
              locked={locked}
              correctAnswer={correctAnswer}
              onSubmit={(v) => submitAnswer(q.id, v)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="btn btn-ghost"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-2">
            {!timed && !locked && (
              <button
                type="button"
                onClick={() => {
                  if (isLast) complete();
                  else setCurrent((c) => Math.min(total - 1, c + 1));
                }}
                className="btn btn-ghost text-xs"
              >
                Skip
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={complete}
                disabled={!locked}
                className="btn btn-primary"
              >
                Finish test →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
                disabled={!locked}
                className="btn btn-primary"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="card rounded-2xl p-4 text-xs text-white/55">
      <div className="mb-2 font-medium text-white/70">Legend</div>
      <div className="grid gap-1.5">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-md bg-white/10" /> Unanswered
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-md bg-emerald-500/30 ring-1 ring-emerald-500/40" />{" "}
          Correct
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-md bg-sakura-500/30 ring-1 ring-sakura-500/40" />{" "}
          Wrong
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-md bg-white/5 outline outline-2 outline-offset-1 outline-brand-400" />{" "}
          Current
        </span>
      </div>
    </div>
  );
}
