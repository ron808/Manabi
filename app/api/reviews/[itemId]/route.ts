import { route } from "@/lib/api/handler";
import { setArchived } from "@/lib/server/reviews";
import { archiveSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const PATCH = route({ body: archiveSchema }, async ({ user, params, body }) => {
  await setArchived(user, params.itemId, body.archived);
  return { ok: true };
});
