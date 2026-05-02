"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { RecentPapers } from "@/components/dashboard/RecentPapers";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { MotionPage, MotionItem } from "@/components/shared/Motion";
import type { PaperSummary } from "@/lib/types";

interface MeResponse {
  name: string;
  totalPapers: number;
  totalQuestions: number;
  accuracy: number;
}

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [papers, setPapers] = useState<PaperSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [m, p] = await Promise.all([
          fetch("/api/me").then((r) => r.json()),
          fetch("/api/papers?limit=5").then((r) => r.json()),
        ]);
        if (cancel) return;
        setMe(m);
        setPapers(p.papers ?? []);
      } catch {
        if (!cancel) setError("Failed to load dashboard");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <MotionPage className="space-y-8 sm:space-y-10">
      <MotionItem>
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-400">
              Welcome back
            </p>
            <h1 className="mt-1 break-words font-display text-3xl leading-[1.05] tracking-tighter2 sm:text-5xl md:text-6xl">
              {me?.name ? (
                <>
                  おかえり,{" "}
                  <span className="text-gradient">{me.name}</span>
                </>
              ) : (
                "おかえり"
              )}
            </h1>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/60">
              Pick up where you left off, or generate a fresh paper.
            </p>
          </div>
          <Link href="/configure" className="btn btn-primary self-start sm:self-auto">
            + Start new paper
          </Link>
        </section>
      </MotionItem>

      <MotionItem>
        <section>
          {!me ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SkeletonCard className="h-24" />
              <SkeletonCard className="h-24" />
              <SkeletonCard className="h-24" />
            </div>
          ) : (
            <StatsBar
              totalPapers={me.totalPapers}
              totalQuestions={me.totalQuestions}
              accuracy={me.accuracy}
            />
          )}
        </section>
      </MotionItem>

      <MotionItem>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-tightish sm:text-3xl">
              Recent papers
            </h2>
            <Link
              href="/history"
              className="text-sm text-white/55 transition-colors hover:text-white"
            >
              View all →
            </Link>
          </div>
          {error ? (
            <div className="rounded-xl border border-sakura-500/30 bg-sakura-500/10 px-4 py-3 text-sm text-sakura-100">
              {error}
            </div>
          ) : !papers ? (
            <div className="space-y-2">
              <SkeletonCard className="h-16" />
              <SkeletonCard className="h-16" />
              <SkeletonCard className="h-16" />
            </div>
          ) : (
            <RecentPapers papers={papers} />
          )}
        </section>
      </MotionItem>

      <MotionItem>
        <section className="grid gap-3 sm:grid-cols-2">
          <Link href="/history" className="card card-hover rounded-2xl p-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              Quick link
            </div>
            <div className="mt-1 font-display text-2xl tracking-tightish">
              Full history →
            </div>
            <p className="mt-1 text-sm text-white/55">
              Every paper you&apos;ve taken with scores and links.
            </p>
          </Link>
          <Link href="/mistakes" className="card card-hover rounded-2xl p-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              Quick link
            </div>
            <div className="mt-1 font-display text-2xl tracking-tightish">
              Mistake log →
            </div>
            <p className="mt-1 text-sm text-white/55">
              Drillable list of every wrong answer with explanations.
            </p>
          </Link>
        </section>
      </MotionItem>
    </MotionPage>
  );
}
