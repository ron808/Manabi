import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnswerReview } from "@/components/app/AnswerReview";
import { ResultsActions } from "@/components/app/ResultsActions";
import { ScoreMark } from "@/components/app/ScoreMark";
import { SECTIONS } from "@/lib/domain/jlpt";
import { getPaperDoc, toPaperView } from "@/lib/server/papers";
import { requireUser } from "@/lib/server/session";
import { notFoundOnly } from "@/lib/server/errors";

export const metadata = { title: "Results" };
export const dynamic = "force-dynamic";

function clock(s: number | null) {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default async function ResultsPage({ params }: { params: { paperId: string } }) {
  const user = await requireUser(`/results/${params.paperId}`);
  const doc = await getPaperDoc(user, params.paperId).catch(notFoundOnly);
  if (!doc) notFound();
  if (doc.status !== "completed") redirect(`/test/${params.paperId}`);
  const paper = toPaperView(doc);

  const bySection = SECTIONS.map((s) => {
    const qs = paper.questions.filter((q) => q.section === s.id);
    return { ...s, total: qs.length, right: qs.filter((q) => q.isCorrect).length };
  }).filter((s) => s.total > 0);
  const mistakes = paper.questions.filter((q) => q.answered && q.isCorrect === false).length;
  const guessed = paper.questions.filter((q) => q.guessed && q.isCorrect).length;
  const limit = paper.config.timeLimitMinutes;

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header className="space-y-8">
        <div>
          <p className="eyebrow">
            {paper.config.level} · {paper.mode === "exam" ? "Exam" : "Practice"} ·{" "}
            {new Date(paper.completedAt ?? paper.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          </p>
          <h1 className="sr-only">Results</h1>
        </div>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <ScoreMark score={paper.score ?? 0} total={paper.totalQuestions} />
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink/55">Time</dt>
              <dd className="mt-0.5 text-lg font-medium tabular">
                {clock(paper.timeTakenSeconds)}
                {limit ? <span className="text-sm text-ink/45"> / {limit}:00</span> : null}
              </dd>
            </div>
            <div>
              <dt className="text-ink/55">To review</dt>
              <dd className="mt-0.5 text-lg font-medium tabular">{mistakes + guessed}</dd>
            </div>
            <div>
              <dt className="text-ink/55">Difficulty</dt>
              <dd className="mt-0.5 text-lg font-medium tabular">{paper.config.difficulty}/5</dd>
            </div>
          </dl>
        </div>

        {bySection.length > 1 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]">
            {bySection.map((s) => (
              <div key={s.id} className="panel p-4">
                <p className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{s.label}</span>
                  <span className="tabular text-ink/60">
                    {s.right}/{s.total}
                  </span>
                </p>
                <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
                  <span className="block h-full rounded-full bg-ink" style={{ width: `${(s.right / s.total) * 100}%` }} />
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {mistakes + guessed > 0 && (
            <p className="max-w-xl text-ink/70">
              {mistakes + guessed === 1 ? "That one goes" : `Those ${mistakes + guessed} go`} into your review deck. Each comes back
              just before you&apos;d forget it.
            </p>
          )}
          <ResultsActions paperId={paper.id} toReview={mistakes + guessed} />
        </div>
      </header>

      <AnswerReview paperId={paper.id} questions={paper.questions} furiganaDefault={user.settings.furigana} />

      <p className="text-center text-sm">
        <Link href="/today" className="text-ink/60 hover:text-ink">
          Back to Today
        </Link>
      </p>
    </div>
  );
}
