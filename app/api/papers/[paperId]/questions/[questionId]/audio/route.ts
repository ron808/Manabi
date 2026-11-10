import { intParam, route } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getPaperDoc } from "@/lib/server/papers";

export const dynamic = "force-dynamic";

// The listening script is fetched only when the learner presses play, so it
// never sits in the page's HTML before they answer.
export const GET = route({}, async ({ user, params }) => {
  const paper = await getPaperDoc(user, params.paperId);
  const id = intParam(params.questionId, "question");
  const q = paper?.questions.find((x) => x.id === id);
  if (!q?.audioScript) throw new ApiError("not_found", "This question has no audio.");
  return new Response(JSON.stringify({ script: q.audioScript }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });
});
