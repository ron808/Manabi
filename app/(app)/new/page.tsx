import { NewPaperForm } from "@/components/app/NewPaperForm";
import { requireUser } from "@/lib/server/session";
import { weakestPoints, workingLevel } from "@/lib/server/stats";

export const metadata = { title: "New paper" };

export default async function NewPaperPage() {
  const user = await requireUser("/new");
  const [level, weak] = await Promise.all([workingLevel(user), weakestPoints(user, 6)]);
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="eyebrow">New paper</p>
        <h1 className="mt-1 font-serif text-[clamp(2.4rem,7vw,3.6rem)] font-normal leading-[1] tracking-[-0.02em]">
          What shall we <em className="text-accent-ink">test</em> today?
        </h1>
      </header>
      <NewPaperForm initialLevel={level} weakPoints={weak.map((w) => w.label)} />
    </div>
  );
}
