import { route } from "@/lib/api/handler";
import { answerReview } from "@/lib/server/reviews";
import { reviewAnswerSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const POST = route({ body: reviewAnswerSchema }, async ({ user, params, body }) => {
  const response = body.choice !== undefined ? { choice: body.choice } : { text: body.text! };
  return answerReview(user, params.itemId, response);
});
