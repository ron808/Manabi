import { intParam, route } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { tutorReply } from "@/lib/ai/tutor";
import { isRevealed } from "@/lib/domain/question";
import { appendTutorTurns, getPaperDoc } from "@/lib/server/papers";
import { tutorSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";
export const maxDuration = 60;

/** "Ask why": streams a short explanation about one graded question. */
export const POST = route({ limit: "tutor", body: tutorSchema }, async ({ user, params, body }) => {
  const paper = await getPaperDoc(user, params.paperId);
  const id = intParam(params.questionId, "question");
  const q = paper?.questions.find((x) => x.id === id);
  if (!paper || !q) throw new ApiError("not_found", "That question doesn't exist.");
  if (!isRevealed(q, paper.mode, paper.status)) {
    throw new ApiError("forbidden", "Answer the question first — then ask away.");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let reply = "";
      try {
        for await (const chunk of tutorReply(q, q.tutor ?? [], body.message)) {
          reply += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        if (reply.trim()) {
          await appendTutorTurns(user, params.paperId, id, [
            { role: "user", content: body.message },
            { role: "assistant", content: reply.trim() },
          ]);
        }
      } catch (err) {
        console.error("[manabi] tutor failed", err);
        controller.enqueue(encoder.encode(reply ? "\n\n(The answer was cut off. Try asking again.)" : "The tutor couldn't answer just now. Try again in a moment."));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
});
