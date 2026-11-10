import { route } from "@/lib/api/handler";
import { SECTIONS, type Section } from "@/lib/domain/jlpt";
import { backfillReviews, deckCounts, dueQueue, library } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ req, user }) => {
  await backfillReviews(user);
  const sp = req.nextUrl.searchParams;
  if (sp.get("scope") === "due") {
    const [cards, counts] = await Promise.all([dueQueue(user), deckCounts(user)]);
    return { cards, counts };
  }
  const section = sp.get("section");
  return library(user, {
    before: sp.get("before"),
    section: SECTIONS.some((s) => s.id === section) ? (section as Section) : null,
    archived: sp.get("archived") === "1",
    q: sp.get("q"),
  });
});
