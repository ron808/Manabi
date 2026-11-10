import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MistakeLibrary } from "@/components/app/MistakeLibrary";
import { backfillReviews, library } from "@/lib/server/reviews";
import { requireUser } from "@/lib/server/session";

export const metadata = { title: "All mistakes" };
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser("/review/library");
  await backfillReviews(user);
  const initial = await library(user, {});
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <Link href="/review" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
          <ArrowLeft size={15} aria-hidden /> Review
        </Link>
        <h1 className="mt-2 font-serif text-[clamp(2.4rem,7vw,3.6rem)] font-normal leading-[1] tracking-[-0.02em]">
          Every <em className="text-accent-ink">mistake</em>, kept.
        </h1>
        <p className="mt-2 max-w-lg text-ink/65">
          Archive the ones you&apos;ve got for good. Your paper history never changes.
        </p>
      </header>
      <MistakeLibrary initial={initial} furigana={user.settings.furigana} />
    </div>
  );
}
