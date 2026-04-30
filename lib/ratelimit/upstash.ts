import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let _enabled: boolean | null = null;

function getRedis(): Redis | null {
  if (_enabled === false) return null;
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _enabled = false;
    if (process.env.NODE_ENV === "production") {
      console.warn("[manabi] Upstash Redis not configured — rate limits disabled");
    }
    return null;
  }
  redis = new Redis({ url, token });
  _enabled = true;
  return redis;
}

interface LimitDef {
  tokens: number;
  windowSec: number;
  prefix: string;
}

const LIMITS = {
  generate: { tokens: 5, windowSec: 60 * 60, prefix: "rl:generate" },
  register: { tokens: 3, windowSec: 60 * 60, prefix: "rl:register" },
  login: { tokens: 10, windowSec: 60 * 15, prefix: "rl:login" },
  api: { tokens: 60, windowSec: 60, prefix: "rl:api" },
} satisfies Record<string, LimitDef>;

export type LimitKey = keyof typeof LIMITS;

const cache = new Map<LimitKey, Ratelimit>();

function limiter(key: LimitKey): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (cache.has(key)) return cache.get(key)!;
  const def = LIMITS[key];
  const rl = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(def.tokens, `${def.windowSec} s`),
    prefix: def.prefix,
    analytics: false,
  });
  cache.set(key, rl);
  return rl;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
  retryAfterMinutes: number;
}

export async function checkLimit(
  key: LimitKey,
  identifier: string
): Promise<RateLimitResult> {
  const rl = limiter(key);
  if (!rl) {
    return {
      success: true,
      remaining: LIMITS[key].tokens,
      reset: Date.now(),
      limit: LIMITS[key].tokens,
      retryAfterMinutes: 0,
    };
  }
  const res = await rl.limit(identifier);
  const retryAfterMinutes = Math.max(
    0,
    Math.ceil((res.reset - Date.now()) / 60000)
  );
  return {
    success: res.success,
    remaining: res.remaining,
    reset: res.reset,
    limit: res.limit,
    retryAfterMinutes,
  };
}
