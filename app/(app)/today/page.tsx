import Link from "next/link";
import { ArrowRight, CalendarDays, Flame } from "lucide-react";
import { GoalRing } from "@/components/app/GoalRing";
import { Heatmap } from "@/components/app/Heatmap";
import { PaperRow } from "@/components/app/PaperRow";
import { DrillWeakSpots, StartSession } from "@/components/app/TodayActions";
import { Seal } from "@/components/ui/Seal";
import { backfillReviews } from "@/lib/server/reviews";
import { requireUser } from "@/lib/server/session";
import { todaySummary } from "@/lib/server/stats";

export const metadata = { title: "Today" };
export const dynamic = "force-dynamic";

function greeting(timezone: string | null) {
  let hour = new Date().getUTCHours();
  try {
    hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: timezone ?? "UTC" }).format(new Date()));
  } catch {
    // keep UTC
  }
  if (hour >= 5 && hour < 11) return { jp: "おはよう", en: "Good morning" };
  if (hour >= 11 && hour < 18) return { jp: "こんにちは", en: "Good afternoon" };
  return { jp: "こんばんは", en: "Good evening" };
}

export default async function TodayPage() {
  const user = await requireUser("/today");
  await backfillReviews(user);
  const s = await todaySummary(user);
  const hello = greeting(user.settings.timezone);
  const firstName = user.name.split(/\s+/)[0];
  const isNew = s.recent.length === 0 && s.reviews.total === 0;
  const goalMet = s.doneToday >= s.dailyGoal;

  return (
    <div className="space-y-10 sm:space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{hello.en}</p>
          <h1 className="mt-1 font-serif text-[clamp(2.4rem,7vw,3.8rem)] font-normal leading-[1] tracking-[-0.02em]">
            <span className="jp" lang="ja">
              {hello.jp}
            </span>
            , {firstName}
          </h1>
        </div>
        {s.examInDays != null && (
          <Link href="/settings" className="chip !gap-2" title="Change your exam date in Settings">
            <CalendarDays size={15} aria-hidden />
            {s.examInDays === 0 ? "JLPT is today — 頑張って" : `${s.examInDays} days to the JLPT`}
          </Link>
        )}
      </header>

      {isNew ? (
        <section className="sheet grid-paper overflow-hidden p-6 sm:p-10">
          <Seal size={44} />
          <h2 className="mt-5 max-w-lg font-serif text-[clamp(1.9rem,5vw,2.6rem)] font-normal leading-[1.05]">
            Your first paper takes about ten minutes.
          </h2>
          <p className="mt-3 max-w-lg text-ink/70">
            Pick a level and Manabi writes a fresh JLPT-style paper. Every mistake you make comes back later, at the
            moment you&apos;re about to forget it — until it sticks.
          </p>
          <Link href="/new" className="btn btn-primary mt-6">
            Write my first paper <ArrowRight size={16} aria-hidden />
          </Link>
        </section>
      ) : (
        <section className="sheet relative overflow-hidden p-5 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <p className="eyebrow">Today&apos;s session</p>
              <p className="mt-2 font-serif text-[clamp(1.8rem,4.6vw,2.5rem)] leading-[1.05]">
                {s.reviews.due > 0 ? (
                  <>
                    <span className="tabular">{s.reviews.due}</span> {s.reviews.due === 1 ? "mistake" : "mistakes"} to revisit
                    <span className="text-ink/45">, then something new.</span>
                  </>
                ) : (
                  <>Nothing due. Ten fresh questions{s.weakest.length ? " on your weak spots" : ""}.</>
                )}
              </p>
              <div className="mt-5">
                <StartSession due={s.reviews.due} />
              </div>
            </div>
            <div className="flex items-center gap-5 sm:flex-col sm:items-end sm:gap-3">
              <GoalRing done={s.doneToday} goal={s.dailyGoal} />
              <div className="text-sm sm:text-right">
                <p className="font-medium">{goalMet ? "Daily goal met" : "Daily goal"}</p>
                <p className="flex items-center gap-1.5 text-ink/60 sm:justify-end">
                  <Flame size={15} className={s.streak ? "text-accent" : ""} aria-hidden />
                  <span>
                    <span className="tabular">{s.streak}</span>-day streak
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {s.inProgress && (
        <section aria-labelledby="resume">
          <h2 id="resume" className="mb-2 text-lg">
            Pick up where you left off
          </h2>
          <ul className="panel p-1.5">
            <PaperRow p={s.inProgress} />
          </ul>
        </section>
      )}

      {!isNew && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-2 lg:gap-8">
          <section aria-labelledby="weak">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="weak" className="text-lg">
                What keeps tripping you up
              </h2>
              {s.weakest.length > 0 && <DrillWeakSpots />}
            </div>
            {s.weakest.length ? (
              <ol className="panel divide-y divide-ink/[0.07] px-4">
                {s.weakest.map((w) => (
                  <li key={w.key} className="flex items-center gap-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="jp-sans block truncate font-medium">{w.label}</span>
                      <span className="text-xs capitalize text-ink/50">
                        {w.kind}
                        {w.level ? ` · ${w.level}` : ""}
                      </span>
                    </span>
                    <span className="w-24 shrink-0">
                      <span className="block h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(w.score * 100)}%` }} />
                      </span>
                      <span className="mt-1 block text-right text-xs tabular text-ink/50">
                        {w.correct}/{w.seen} right
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="panel p-5 text-sm text-ink/60">
                Nothing yet. As you answer, Manabi tracks every grammar point, word and kanji — the shaky ones show up here.
              </p>
            )}
          </section>

          <section aria-labelledby="activity">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="activity" className="text-lg">
                Last 18 weeks
              </h2>
              <p className="text-sm text-ink/55">
                Best streak <span className="tabular">{s.bestStreak}</span>
              </p>
            </div>
            <div className="panel p-5">
              <Heatmap days={s.heatmap} />
              <p className="mt-4 text-sm text-ink/60">
                <span className="tabular">{s.reviews.learned}</span> of <span className="tabular">{s.reviews.total}</span> past mistakes
                now firmly learned.
              </p>
            </div>
          </section>
        </div>
      )}

      {s.recent.length > 0 && (
        <section aria-labelledby="recent">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="recent" className="text-lg">
              Recent papers
            </h2>
            <Link href="/history" className="text-sm text-ink/60 hover:text-ink">
              All history
            </Link>
          </div>
          <ul className="panel p-1.5">
            {s.recent.map((p) => (
              <PaperRow key={p.id} p={p} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
