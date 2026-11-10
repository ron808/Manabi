import { route } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { reviewScript } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ user, params }) => {
  const script = await reviewScript(user, params.itemId);
  if (!script) throw new ApiError("not_found", "This card has no audio.");
  return new Response(JSON.stringify({ script }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });
});
