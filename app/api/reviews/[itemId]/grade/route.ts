import { route } from "@/lib/api/handler";
import { gradeReview } from "@/lib/server/reviews";
import { reviewGradeSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export const POST = route({ body: reviewGradeSchema }, async ({ user, params, body }) => gradeReview(user, params.itemId, body.rating));
