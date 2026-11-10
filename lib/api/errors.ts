export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "gone"
  | "rate_limited"
  | "generation_failed"
  | "internal";

const STATUS: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  gone: 410,
  rate_limited: 429,
  generation_failed: 502,
  internal: 500,
};

/** Thrown anywhere in a request; the route wrapper turns it into JSON. */
export class ApiError extends Error {
  readonly status: number;
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly extra?: Record<string, unknown>,
    readonly headers?: Record<string, string>
  ) {
    super(message);
    this.status = STATUS[code];
  }
}

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; [k: string]: unknown };
}
