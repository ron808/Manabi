import { HistoryList } from "@/components/app/HistoryList";
import { ScoreTrend } from "@/components/app/ScoreTrend";
import { listPapers } from "@/lib/server/papers";
import { requireUser } from "@/lib/server/session";

export const metadata = { title: "History" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await requireUser("/history");
  const [initial, completed] = await Promise.all([
    listPapers(user, { limit: 20 }),
    listPapers(user, { limit: 20, status: ["completed"] }),
  ]);
  const trend = completed.papers
    .filter((p) => p.totalQuestions > 0)
    .map((p) => ({
      pct: Math.round(((p.score ?? 0) / p.totalQuestions) * 100),
      label: `${p.level} · ${new Date(p.completedAt ?? p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    }))
    .reverse();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="eyebrow">History</p>
        <h1 className="mt-1 font-serif text-[clamp(2.4rem,7vw,3.6rem)] font-normal leading-[1] tracking-[-0.02em]">
          Every paper, <em className="text-accent-ink">in order</em>.
        </h1>
      </header>
      <ScoreTrend points={trend} />
      {initial.papers.length ? (
        <HistoryList initial={initial} />
      ) : (
        <p className="panel p-8 text-center text-ink/60">No papers yet. Your first one will show up here.</p>
      )}
    </div>
  );
}
