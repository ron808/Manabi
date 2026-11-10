"use client";

/** Error with the server's human-readable message (from `{ error: { code, message } }`). */
export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
  }
}

async function readError(res: Response): Promise<ApiClientError> {
  let code = "internal";
  let message = "Something went wrong. Try again.";
  try {
    const j = await res.json();
    code = j?.error?.code ?? code;
    message = j?.error?.message ?? message;
  } catch {
    // not JSON
  }
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = `/login?reason=expired&next=${encodeURIComponent(window.location.pathname)}`;
  }
  return new ApiClientError(message, res.status, code);
}

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiClientError("You seem to be offline. Check your connection and try again.", 0, "offline");
  }
  if (!res.ok) throw await readError(res);
  return (await res.json()) as T;
}

/** POST that returns a streamed body; yields decoded text chunks. */
export async function* streamText(path: string, body: unknown, signal?: AbortSignal): AsyncGenerator<string> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw await readError(res);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

/** Saves a setting in the background; failures are non-fatal. */
export function saveSetting(settings: Record<string, unknown>) {
  void api("/api/me", { method: "PATCH", body: { settings } }).catch(() => {});
}
