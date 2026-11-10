import { route } from "@/lib/api/handler";
import { changePassword } from "@/lib/server/users";
import { passwordSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const POST = route({ limit: "sensitive", body: passwordSchema }, async ({ user, body }) => {
  await changePassword(user, body.current, body.next);
  return { ok: true };
});
