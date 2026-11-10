import { route } from "@/lib/api/handler";
import { completePaper } from "@/lib/server/papers";

export const dynamic = "force-dynamic";

// No body: score and time are computed on the server from what it recorded.
export const POST = route({}, async ({ user, params }) => {
  const { paper, transitioned } = await completePaper(user, params.paperId);
  return { ok: true, alreadyCompleted: !transitioned, score: paper.score, totalQuestions: paper.totalQuestions };
});
