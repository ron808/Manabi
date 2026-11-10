import { ApiError } from "@/lib/api/errors";

/** For pages: a bad id becomes a 404; anything else is a real error and propagates. */
export function notFoundOnly(err: unknown): null {
  if (err instanceof ApiError && err.code === "not_found") return null;
  throw err;
}
