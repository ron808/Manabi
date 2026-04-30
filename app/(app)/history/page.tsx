"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RecentPapers } from "@/components/dashboard/RecentPapers";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { MotionPage, MotionItem } from "@/components/shared/Motion";
import type { PaperSummary } from "@/lib/types";

export default function HistoryPage() {
  const [papers, setPapers] = useState<PaperSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/papers?limit=50");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setPapers(j.papers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <MotionPage className="space-y-6 sm:space-y-8">
      <MotionItem>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-400">
              History
            </p>
            <h1 className="mt-1 font-display text-4xl leading-[1.05] tracking-tighter2 sm:text-5xl md:text-6xl">
              Every <span className="text-gradient">paper</span>, in one place.
            </h1>
          </div>
          <Link
            href="/configure"
            className="btn btn-primary self-start sm:self-auto"
          >
            + New paper
          </Link>
        </header>
      </MotionItem>

      <MotionItem>
        {error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : !papers ? (
          <div className="space-y-2">
            <SkeletonCard className="h-16" />
            <SkeletonCard className="h-16" />
            <SkeletonCard className="h-16" />
            <SkeletonCard className="h-16" />
          </div>
        ) : papers.length === 0 ? (
          <div className="card rounded-2xl p-10 text-center">
            <p className="text-white/60">
              You haven&apos;t taken a paper yet. Generate your first one and you&apos;ll see it here.
            </p>
            <Link href="/configure" className="btn btn-primary mt-4">
              Start your first paper →
            </Link>
          </div>
        ) : (
          <RecentPapers papers={papers} />
        )}
      </MotionItem>
    </MotionPage>
  );
}
