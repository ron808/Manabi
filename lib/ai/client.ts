import Groq from "groq-sdk";

let _client: Groq | null = null;

export function hasGroqKey(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/** Dev-only stand-in when no key is configured. Never used in production. */
export function fixturesEnabled(): boolean {
  return !hasGroqKey() && process.env.NODE_ENV !== "production";
}

export function groq(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
    _client = new Groq({ apiKey, maxRetries: 2, timeout: 45_000 });
  }
  return _client;
}
