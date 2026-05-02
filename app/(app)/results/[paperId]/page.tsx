"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScoreSummary } from "@/components/results/ScoreSummary";
import { AnswerReview } from "@/components/results/AnswerReview";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { MotionPage, MotionItem } from "@/components/shared/Motion";
import { GenerationLoader } from "@/components/shared/GenerationLoader";
import type { PaperFull } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const { paperId } = useParams<{ paperId: string }>();
  const [paper, setPaper] = useState<PaperFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/papers/${paperId}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setPaper(j.paper as PaperFull);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [paperId]);

  useEffect(() => {
    load();
  }, [load]);

  async function regenerateSimilar() {
    if (!paper) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/papers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paper.config),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || j.error || "Failed");
      router.push(`/test/${j.paperId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setRegenerating(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <ErrorBanner message={error} onRetry={load} />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="space-y-3">
        <SkeletonCard className="h-44" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
      </div>
    );
  }

  return (
    <>
    <GenerationLoader
      open={regenerating}
      questionCount={paper.config.questionCount}
    />
    <MotionPage className="space-y-6 sm:space-y-8">
      <MotionItem>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-400">
              Results
            </p>
            <h1 className="mt-1 break-words font-display text-3xl leading-[1.05] tracking-tighter2 sm:text-5xl md:text-6xl">
              お疲れさま — <span className="text-gradient">well done.</span>
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link href="/dashboard" className="btn btn-ghost">
              Dashboard
            </Link>
            <Link href="/configure" className="btn btn-ghost">
              New paper
            </Link>
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              type="button"
              disabled={regenerating}
              onClick={regenerateSimilar}
              className="btn btn-primary col-span-2 sm:col-span-1"
            >
              {regenerating ? "Generating…" : "Regenerate similar →"}
            </motion.button>
          </div>
        </header>
      </MotionItem>

      <MotionItem>
        <ScoreSummary paper={paper} />
      </MotionItem>
      <MotionItem>
        <AnswerReview questions={paper.questions} />
      </MotionItem>
    </MotionPage>
    </>
  );
}
