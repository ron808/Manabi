import { intParam, route } from "@/lib/api/handler";
import { setFlag } from "@/lib/server/papers";
import { flagSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const PATCH = route({ body: flagSchema }, async ({ user, params, body }) => {
  await setFlag(user, params.paperId, intParam(params.questionId, "question"), body.flagged);
  return { ok: true };
});
