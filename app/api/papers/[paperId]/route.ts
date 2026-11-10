import { route } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { getPaperDoc, toPaperView } from "@/lib/server/papers";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ user, params }) => {
  const paper = await getPaperDoc(user, params.paperId);
  if (!paper) throw new ApiError("not_found", "That paper doesn't exist.");
  return { paper: toPaperView(paper) };
});
