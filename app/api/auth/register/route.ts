import { route } from "@/lib/api/handler";
import { registerUser } from "@/lib/server/users";
import { registerSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const POST = route({ auth: false, limit: "register", body: registerSchema }, async ({ body }) => {
  const { id } = await registerUser(body);
  return Response.json({ ok: true, id }, { status: 201 });
});
