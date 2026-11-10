// Which Groq model handles each call. Every free model has its own rate-limit
// bucket (about 30 requests and 8K tokens a minute), so spreading calls across
// all of them multiplies the headroom. A model that hits its limit — or has
// been retired — sits out for a while and the next one takes over.

/**
 * Models with strict JSON-schema output on Groq (checked November 2026).
 * qwen3.8-27b is a preview model and may be withdrawn at short notice; if it
 * is, its errors take it out of rotation automatically.
 * Override with GROQ_MODELS="model-a,model-b" without a code change.
 */
export const DEFAULT_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"];

export function modelPool(): string[] {
  const fromEnv = process.env.GROQ_MODELS?.split(",").map((m) => m.trim()).filter(Boolean);
  return fromEnv?.length ? fromEnv : DEFAULT_MODELS;
}

// Per server instance. Good enough: a cold instance just rediscovers a limit
// with one failed call, then routes around it.
const coolingUntil = new Map<string, number>();
let cursor = 0;

export function isCooling(model: string, now = Date.now()) {
  return (coolingUntil.get(model) ?? 0) > now;
}

export function coolDown(model: string, ms: number, now = Date.now()) {
  if (ms > 0) coolingUntil.set(model, Math.max(coolingUntil.get(model) ?? 0, now + ms));
}

/** Test hook. */
export function resetRotation() {
  coolingUntil.clear();
  cursor = 0;
}

/**
 * The order to try models in for one call: round-robin across the pool so
 * consecutive calls land on different models, with any model that's cooling
 * down moved to the back (still tried as a last resort).
 */
export function nextModels(pool = modelPool(), now = Date.now()): string[] {
  const start = cursor++ % pool.length;
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  return [...rotated.filter((m) => !isCooling(m, now)), ...rotated.filter((m) => isCooling(m, now))];
}

/** A blind checker should be a different model from the one that wrote the questions. */
export function checkerFor(writer: string, pool = modelPool(), now = Date.now()): string {
  const others = pool.filter((m) => m !== writer);
  return others.find((m) => !isCooling(m, now)) ?? others[0] ?? writer;
}

/**
 * How long a model should sit out after an error. Rate limits honour
 * retry-after; a retired or unknown model is benched for an hour.
 */
export function cooldownFor(err: unknown): number {
  const e = err as { status?: number; headers?: Headers | Record<string, string>; error?: unknown; message?: string };
  const status = e?.status;
  const text = JSON.stringify(e?.error ?? "") + " " + (e?.message ?? "");
  if (status === 429) {
    const header =
      e.headers instanceof Headers ? e.headers.get("retry-after") : (e.headers as Record<string, string> | undefined)?.["retry-after"];
    const seconds = Number(header);
    return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 600) * 1000 : 60_000;
  }
  if (status === 404 || /decommission|model_not_found|does not exist/i.test(text)) return 60 * 60_000;
  if ((status !== undefined && status >= 500) || /Connection|Timeout/i.test((err as Error)?.name ?? "")) return 15_000;
  // A bad answer (unparseable, nothing valid) isn't the model's capacity: no cooldown.
  return 0;
}

/**
 * Reasoning settings differ per model family on Groq: Qwen writes its
 * reasoning into the answer unless told to hide it (JSON mode requires
 * that), while GPT-OSS keeps reasoning in a separate field and rejects
 * `reasoning_format`.
 */
export function reasoningOptions(model: string, effort: "low" | "medium") {
  if (model.startsWith("qwen/")) return { reasoning_effort: effort, reasoning_format: "hidden" as const };
  return { reasoning_effort: effort };
}
