import mongoose from "mongoose";
import { Activity } from "@/lib/db/models/Activity";
import { Mastery } from "@/lib/db/models/Mastery";
import { ReviewItem } from "@/lib/db/models/ReviewItem";
import { dayKey } from "@/lib/domain/dates";
import { pointKey } from "@/lib/domain/points";
import type { PointKind } from "@/lib/domain/jlpt";
import type { StoredQuestion } from "@/lib/domain/question";
import { newCardState } from "@/lib/domain/srs";

// Side effects of learning events: the daily activity row, per-point mastery,
// and review cards for mistakes. Each is idempotent per event or guarded by
// the caller (only run once a paper actually transitions to completed).

type Id = mongoose.Types.ObjectId | string;

export async function recordActivity(
  userId: Id,
  timezone: string | null,
  inc: Partial<{ answered: number; correct: number; reviews: number; papers: number }>,
  at = new Date()
) {
  const day = dayKey(at, timezone);
  await Activity.updateOne(
    { userId, day },
    { $inc: { answered: 0, correct: 0, reviews: 0, papers: 0, ...inc } },
    { upsert: true }
  );
}

export interface MasteryEvent {
  point: string;
  kind: PointKind | string;
  level: string;
  correct: boolean;
}

export async function recordMastery(userId: Id, events: MasteryEvent[], at = new Date()) {
  const ops = events
    .filter((e) => e.point.trim())
    .map((e) => ({
      updateOne: {
        filter: { userId, key: pointKey(e.kind as PointKind, e.point) },
        update: {
          $setOnInsert: { label: e.point, kind: e.kind, level: e.level },
          $inc: { seen: 1, correct: e.correct ? 1 : 0 },
          $set: { lastSeenAt: at },
          $push: { recent: { $each: [e.correct ? 1 : 0], $slice: -5 } },
        },
        upsert: true,
      },
    }));
  if (ops.length) await Mastery.bulkWrite(ops, { ordered: true });
}

/** Stored copy of a question for the review deck — answer state kept, chat dropped. */
export function reviewSnapshot(q: StoredQuestion): StoredQuestion {
  return { ...q, tutor: [], flagged: false };
}

export async function createReviewItems(
  userId: Id,
  paperId: Id,
  level: string,
  questions: StoredQuestion[],
  at = new Date()
) {
  if (!questions.length) return;
  await ReviewItem.bulkWrite(
    questions.map((q) => ({
      updateOne: {
        filter: { userId, paperId, questionId: q.id },
        update: {
          $setOnInsert: {
            level,
            question: reviewSnapshot(q),
            pointKey: q.point ? pointKey(q.pointKind, q.point) : null,
            card: newCardState(at),
            archived: false,
            createdAt: at,
            lastResult: null,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}
