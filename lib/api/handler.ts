import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { z, type ZodType } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { getCurrentUser, type CurrentUser } from "@/lib/server/session";
import type { LimitKey } from "@/lib/ratelimit/upstash";
import { ApiError, type ApiErrorBody } from "./errors";
import { enforceLimit, getClientIp } from "./helpers";

interface Options<B> {
  /** Defaults to true. */
  auth?: boolean;
  /** Rate-limit bucket, keyed by user (or IP when unauthenticated). Defaults to "api". */
  limit?: LimitKey | null;
  body?: ZodType<B>;
}

interface Ctx<B, A extends boolean> {
  req: NextRequest;
  params: Record<string, string>;
  user: A extends false ? null : CurrentUser;
  body: B;
}

/**
 * One wrapper for every API route: session check, rate limit, JSON body
 * validation, uniform `{ error: { code, message } }` errors, logged 500s.
 * Return a plain value to send it as JSON, or a Response to send it as-is.
 */
export function route<B = undefined, A extends boolean = true>(
  opts: Options<B> & { auth?: A },
  fn: (ctx: Ctx<B, A>) => Promise<unknown>
) {
  return async (req: NextRequest, ctx: { params?: Record<string, string> } = {}) => {
    try {
      const needsAuth = opts.auth !== false;
      const [user] = await Promise.all([needsAuth ? getCurrentUser() : Promise.resolve(null), connectDB()]);
      if (needsAuth && !user) throw new ApiError("unauthorized", "Your session has ended. Sign in again.");

      const limit = opts.limit === undefined ? "api" : opts.limit;
      if (limit) await enforceLimit(limit, user ? `user:${user.id}` : `ip:${getClientIp(req)}`);

      let body = undefined as B;
      if (opts.body) {
        let raw: unknown;
        try {
          raw = await req.json();
        } catch {
          throw new ApiError("bad_request", "Request body must be JSON.");
        }
        const parsed = opts.body.safeParse(raw);
        if (!parsed.success) {
          const first = parsed.error.issues[0];
          throw new ApiError("bad_request", first ? `${first.path.join(".") || "body"}: ${first.message}` : "Invalid request.", {
            issues: z.treeifyError(parsed.error),
          });
        }
        body = parsed.data;
      }

      const result = await fn({ req, params: ctx.params ?? {}, user: user as Ctx<B, A>["user"], body });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown): NextResponse<ApiErrorBody> {
  // Next's own control-flow signals (dynamic-usage detection, redirects) must pass through.
  const digest = (err as { digest?: unknown } | null)?.digest;
  if (typeof digest === "string" && (digest === "DYNAMIC_SERVER_USAGE" || digest.startsWith("NEXT_"))) throw err;
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, ...(err.extra ?? {}) } },
      { status: err.status, headers: err.headers }
    );
  }
  console.error("[manabi] unhandled API error", err);
  return NextResponse.json(
    { error: { code: "internal", message: "Something went wrong on our side. Try again." } },
    { status: 500 }
  );
}

export function objectId(value: string | undefined, what = "id"): mongoose.Types.ObjectId {
  if (!value || !mongoose.isValidObjectId(value)) throw new ApiError("not_found", `That ${what} doesn't exist.`);
  return new mongoose.Types.ObjectId(value);
}

export function intParam(value: string | undefined, what = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 1000) throw new ApiError("not_found", `That ${what} doesn't exist.`);
  return n;
}
