import { notFound, redirect } from "next/navigation";
import { TestRunner } from "@/components/app/TestRunner";
import { openPaper, toPaperView } from "@/lib/server/papers";
import { requireUser } from "@/lib/server/session";
import { notFoundOnly } from "@/lib/server/errors";

export const metadata = { title: "Paper" };
export const dynamic = "force-dynamic";

export default async function TestPage({ params }: { params: { paperId: string } }) {
  const user = await requireUser(`/test/${params.paperId}`);
  const paper = await openPaper(user, params.paperId).catch(notFoundOnly);
  if (!paper) notFound();
  if (paper.status === "completed") redirect(`/results/${params.paperId}`);
  return <TestRunner paper={toPaperView(paper)} furiganaDefault={user.settings.furigana} />;
}
