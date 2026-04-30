import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/authOptions";
import { checkLimit, type LimitKey } from "@/lib/ratelimit/upstash";

export type AuthedSession = {
  userId: string;
  email: string;
  name: string | null | undefined;
};

export async function requireAuth(): Promise<
  | { ok: true; session: AuthedSession }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return {
    ok: true,
    session: {
      userId,
      email: session.user.email!,
      name: session.user.name,
    },
  };
}

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "127.0.0.1";
}

export async function applyRateLimit(
  key: LimitKey,
  identifier: string
): Promise<NextResponse | null> {
  const res = await checkLimit(key, identifier);
  if (!res.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message:
          key === "generate"
            ? `You have reached the limit of ${res.limit} papers per hour. Try again in ${res.retryAfterMinutes} minutes.`
            : `Rate limit exceeded. Try again in ${res.retryAfterMinutes} minutes.`,
        retryAfterMinutes: res.retryAfterMinutes,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, res.retryAfterMinutes * 60)),
          "X-RateLimit-Limit": String(res.limit),
          "X-RateLimit-Remaining": String(res.remaining),
          "X-RateLimit-Reset": String(res.reset),
        },
      }
    );
  }
  return null;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
