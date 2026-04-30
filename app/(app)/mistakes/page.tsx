"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { MotionPage, MotionItem, MotionList } from "@/components/shared/Motion";

interface MistakeItem {
  paperId: string;
  paperLevel: string;
  paperFormat: string;
  completedAt: string | null;
  question: {
    id: number;
    format: string;
    questionJp: string;
    passageJp: string | null;
    options: string[] | null;
    correctAnswer: string;
    userAnswer: string | null;
    explanationJp: string;
    explanationEn: string;
    englishGloss: string;
  };
}

export default function MistakesPage() {
  const [items, setItems] = useState<MistakeItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/mistakes");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setItems(j.mistakes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function clearAll() {
    setBusy(true);
    try {
      const res = await fetch("/api/mistakes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to clear");
      }
      setItems([]);
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear");
    } finally {
      setBusy(false);
    }
  }

  const formats = Array.from(
    new Set((items ?? []).map((m) => m.question.format))
  );
  const filtered =
    filter === "all"
      ? items ?? []
      : (items ?? []).filter((m) => m.question.format === filter);

  return (
    <MotionPage className="space-y-6 sm:space-y-8">
      <MotionItem>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-400">
              Mistake log
            </p>
            <h1 className="mt-1 font-display text-4xl leading-[1.05] tracking-tighter2 sm:text-5xl md:text-6xl">
              What you <span className="text-gradient">missed</span>.
            </h1>
          </div>
          {items && items.length > 0 && (
            <div className="flex gap-2 self-start sm:self-auto">
              <AnimatePresence mode="wait" initial={false}>
                {!confirming ? (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setConfirming(true)}
                    className="btn btn-ghost text-xs"
                  >
                    Clear all
                  </motion.button>
                ) : (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="flex gap-2"
                  >
                    <button
                      onClick={() => setConfirming(false)}
                      className="btn btn-ghost text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={clearAll}
                      disabled={busy}
                      className="btn btn-primary text-xs"
                    >
                      {busy ? "Clearing…" : "Confirm clear"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </header>
      </MotionItem>

      {error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : !items ? (
        <div className="space-y-2">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-32" />
        </div>
      ) : items.length === 0 ? (
        <MotionItem>
          <div className="card rounded-2xl p-10 text-center">
            <p className="jp font-display text-3xl">完璧</p>
            <p className="mt-2 text-white/60">
              No mistakes logged yet. Keep going!
            </p>
            <Link href="/configure" className="btn btn-primary mt-4">
              Generate a paper →
            </Link>
          </div>
        </MotionItem>
      ) : (
        <>
          {formats.length > 1 && (
            <MotionItem>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                <button
                  onClick={() => setFilter("all")}
                  data-active={filter === "all"}
                  className="pill whitespace-nowrap"
                >
                  All ({items.length})
                </button>
                {formats.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    data-active={filter === f}
                    className="pill whitespace-nowrap"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </MotionItem>
          )}

          <MotionList className="space-y-3" delay={0.05} step={0.05}>
            {filtered.map((m, i) => {
              const q = m.question;
              return (
                <MotionItem key={`${m.paperId}-${q.id}-${i}`}>
                  <motion.li
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="card rounded-2xl p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-brand-400">
                        {q.format}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-white/65">
                        {m.paperLevel}
                      </span>
                      {m.completedAt && (
                        <span className="text-white/40">
                          {new Date(m.completedAt).toLocaleDateString()}
                        </span>
                      )}
                      <Link
                        href={`/results/${m.paperId}`}
                        className="ml-auto text-white/55 hover:text-brand-400"
                      >
                        Open paper →
                      </Link>
                    </div>

                    {q.passageJp && (
                      <p
                        className="jp mb-3 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-sm text-white/75"
                        lang="ja"
                      >
                        {q.passageJp}
                      </p>
                    )}

                    <p className="jp text-lg text-white sm:text-xl" lang="ja">
                      {q.questionJp}
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-sakura-500/30 bg-sakura-500/10 px-3 py-2 text-sm">
                        <div className="text-[11px] uppercase tracking-wider text-sakura-200/80">
                          You answered
                        </div>
                        <div className="jp mt-0.5 text-sakura-100" lang="ja">
                          {q.userAnswer || "— skipped —"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm">
                        <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">
                          Correct answer
                        </div>
                        <div className="jp mt-0.5 text-emerald-100" lang="ja">
                          {q.correctAnswer}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-white/45">
                          Explanation
                        </div>
                        <p className="mt-1 text-sm text-white/85">
                          {q.explanationEn}
                        </p>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-white/45">
                          Gloss
                        </div>
                        <p className="mt-1 text-sm text-white/70">
                          {q.englishGloss}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                </MotionItem>
              );
            })}
          </MotionList>
        </>
      )}
    </MotionPage>
  );
}
