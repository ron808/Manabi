import { route } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { isLevel } from "@/lib/domain/jlpt";
import { generatePaper, planPaper } from "@/lib/server/generation";
import { listPapers } from "@/lib/server/papers";
import { generateSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = route({}, async ({ req, user }) => {
  const sp = req.nextUrl.searchParams;
  const level = sp.get("level");
  const mode = sp.get("mode");
  return listPapers(user, {
    before: sp.get("before"),
    limit: Number(sp.get("limit") ?? 20) || 20,
    level: isLevel(level) ? level : null,
    mode: mode === "exam" || mode === "practice" ? mode : null,
  });
});

/**
 * Writes a new paper. Streams newline-delimited JSON so the page can show
 * real progress: {"type":"progress","done":5,"total":15} … then
 * {"type":"done","paperId":"…"} or {"type":"error","message":"…"}.
 */
export const POST = route({ limit: "generate", body: generateSchema }, async ({ user, body }) => {
  const plan = await planPaper(user, body);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        const paperId = await generatePaper(user, plan, (p) => send({ type: "progress", ...p }));
        send({ type: "done", paperId });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Something went wrong writing the paper. Try again.";
        if (!(err instanceof ApiError)) console.error("[manabi] generation crashed", err);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
});
