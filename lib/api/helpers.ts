import type { NextRequest } from "next/server";
import { checkLimit, type LimitKey } from "@/lib/ratelimit/upstash";
import { ApiError } from "./errors";

export function getClientIp(req: NextRequest | Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

const LIMIT_MESSAGES: Partial<Record<LimitKey, (limit: number, minutes: number) => string>> = {
  generate: (limit, minutes) => `You've written ${limit} papers this hour. The next one unlocks in ${minutes} min.`,
  tutor: (limit, minutes) => `That's ${limit} questions to the tutor this hour. Try again in ${minutes} min.`,
  login: (_l, minutes) => `Too many sign-in attempts. Try again in ${minutes} min.`,
  register: (_l, minutes) => `Too many sign-ups from this network. Try again in ${minutes} min.`,
};

/** Throws a 429 ApiError when the identifier is over its limit. */
export async function enforceLimit(key: LimitKey, identifier: string): Promise<void> {
  const res = await checkLimit(key, identifier);
  if (res.success) return;
  const minutes = Math.max(1, res.retryAfterMinutes);
  const message = LIMIT_MESSAGES[key]?.(res.limit, minutes) ?? `Slow down a little — try again in ${minutes} min.`;
  throw new ApiError(
    "rate_limited",
    message,
    { retryAfterMinutes: minutes },
    {
      "Retry-After": String(minutes * 60),
      "X-RateLimit-Limit": String(res.limit),
      "X-RateLimit-Remaining": String(res.remaining),
    }
  );
}
