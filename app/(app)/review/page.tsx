import Link from "next/link";
import { Library } from "lucide-react";
import { ReviewSession } from "@/components/app/ReviewSession";
import { Seal } from "@/components/ui/Seal";
import { backfillReviews, deckCounts, dueQueue } from "@/lib/server/reviews";
import { requireUser } from "@/lib/server/session";
import { ReviewEmpty } from "@/components/app/ReviewEmpty";

export const metadata = { title: "Review" };
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser("/review");
  await backfillReviews(user);
  const [cards, counts] = await Promise.all([dueQueue(user), deckCounts(user)]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Review</p>
          <h1 className="mt-1 font-serif text-[clamp(2.4rem,7vw,3.6rem)] font-normal leading-[1] tracking-[-0.02em]">
            {cards.length ? (
              <>
                <span className="tabular">{counts.due}</span> due <em className="text-accent-ink">today</em>
              </>
            ) : (
              <>All caught up</>
            )}
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            <span className="tabular">{counts.learned}</span> learned · <span className="tabular">{counts.total}</span> in your deck
          </p>
        </div>
        <Link href="/review/library" className="btn btn-quiet btn-sm">
          <Library size={15} aria-hidden /> All mistakes
        </Link>
      </header>

      {cards.length ? (
        <ReviewSession cards={cards} furiganaDefault={user.settings.furigana} />
      ) : (
        <div className="sheet grid-paper mx-auto max-w-xl p-6 text-center sm:p-10">
          <div className="mx-auto w-fit">
            <Seal size={48} char="済" />
          </div>
          <h2 className="mt-5 text-2xl">Nothing to review right now</h2>
          <p className="mt-2 text-ink/65">
            {counts.total
              ? "Every past mistake is scheduled for later. Use the time for something new."
              : "Mistakes from your papers land here, then come back on a schedule until you know them."}
          </p>
          <ReviewEmpty />
        </div>
      )}
    </div>
  );
}
