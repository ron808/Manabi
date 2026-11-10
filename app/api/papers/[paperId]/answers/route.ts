import { route } from "@/lib/api/handler";
import { answerQuestion } from "@/lib/server/papers";
import { answerSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const POST = route({ body: answerSchema }, async ({ user, params, body }) => {
  const response = body.choice !== undefined ? { choice: body.choice } : { text: body.text! };
  return answerQuestion(user, params.paperId, body.questionId, response, { guessed: body.guessed });
});
