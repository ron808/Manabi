import { route } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { isValidTimeZone } from "@/lib/domain/dates";
import { deleteAccount, updateProfile } from "@/lib/server/users";
import { deleteAccountSchema, profileSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ user }) => ({ name: user.name, email: user.email, settings: user.settings }));

export const PATCH = route({ body: profileSchema }, async ({ user, body }) => {
  const tz = body.settings?.timezone;
  if (tz != null && !isValidTimeZone(tz)) throw new ApiError("bad_request", "Unknown timezone.");
  const updated = await updateProfile(user, body);
  return { name: updated.name, email: updated.email, settings: updated.settings };
});

export const DELETE = route({ limit: "sensitive", body: deleteAccountSchema }, async ({ user, body }) => {
  await deleteAccount(user, body.password);
  return { ok: true };
});
