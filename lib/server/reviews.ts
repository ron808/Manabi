import mongoose from "mongoose";
import { ApiError } from "@/lib/api/errors";
import { Paper } from "@/lib/db/models/Paper";
import { ReviewItem, type ReviewItemDoc } from "@/lib/db/models/ReviewItem";
import { User } from "@/lib/db/models/User";
import {
  grade,
  normalizeStoredQuestion,
  toView,
  type QuestionView,
  type Response,
  type StoredQuestion,
} from "@/lib/domain/question";
import type { Section } from "@/lib/domain/jlpt";
import { gradeCard, humanInterval, previewIntervals, type ReviewRating } from "@/lib/domain/srs";
import { withCheck } from "./check";
import { createReviewItems, recordActivity, recordMastery } from "./learning";
import type { CurrentUser } from "./session";

export const SESSION_SIZE = 20;

export interface ReviewCard {
  id: string;
  paperId: string;
  questionId: number;
  level: string;
  due: string;
  reps: number;
  lapses: number;
  /** The question with answers hidden, as it is shown before re-answering. */
  question: QuestionView;
}

export interface ReviewReveal {
  isCorrect: boolean;
  question: QuestionView;
  /** What the learner answered originally, when the mistake was made. */
  original: { choice: number | null; text: string | null };
  /** Due-date preview per rating, for correct answers ("Good · 4d"). */
  intervals: Record<ReviewRating, string> | null;
  /** Wrong answers are graded "again" immediately. */
  scheduledFor: string | null;
}

export interface LibraryItem {
  id: string;
  paperId: string;
  level: string;
  createdAt: string;
  due: string;
  archived: boolean;
  lapses: number;
  reps: number;
  question: QuestionView;
}

const uid = (user: CurrentUser) => new mongoose.Types.ObjectId(user.id);

function itemFilter(user: CurrentUser, itemId: string) {
  if (!mongoose.isValidObjectId(itemId)) throw new ApiError("not_found", "That review card doesn't exist.");
  return { _id: new mongoose.Types.ObjectId(itemId), userId: uid(user) };
}

/** A fresh (unanswered) copy of the stored question for re-answering. */
function blankQuestion(q: StoredQuestion): StoredQuestion {
  return { ...q, userChoice: null, userText: null, isCorrect: null, answeredAt: null, guessed: false, tutor: [] };
}

function toCard(item: ReviewItemDoc): ReviewCard {
  const q = normalizeStoredQuestion(item.question);
  return {
    id: String(item._id),
    paperId: String(item.paperId),
    questionId: item.questionId,
    level: item.level,
    due: new Date(item.card.due).toISOString(),
    reps: item.card.reps,
    lapses: item.card.lapses,
    question: withCheck(toView(blankQuestion(q), "practice", "in_progress"), q, "practice"),
  };
}

/**
 * Users who made mistakes before the review deck existed get their old
 * wrong answers imported once, on first visit.
 */
export async function backfillReviews(user: CurrentUser) {
  const claimed = await User.findOneAndUpdate(
    { _id: user.id, reviewBackfilledAt: null },
    { $set: { reviewBackfilledAt: new Date() } }
  ).lean();
  if (!claimed) return;

  const papers = await Paper.find({ userId: user.id, status: "completed" })
    .sort({ completedAt: -1 })
    .limit(200)
    .select("questions config.level completedAt")
    .lean<{ _id: mongoose.Types.ObjectId; questions: unknown[]; config: { level: string } }[]>();

  for (const p of papers) {
    const wrong = (p.questions ?? []).map(normalizeStoredQuestion).filter((q) => q.isCorrect === false);
    if (wrong.length) await createReviewItems(user.id, p._id, p.config?.level ?? "", wrong);
  }
}

export async function dueCount(user: CurrentUser, now = new Date()): Promise<number> {
  return ReviewItem.countDocuments({ userId: uid(user), archived: false, "card.due": { $lte: now } });
}

export async function deckCounts(user: CurrentUser, now = new Date()) {
  const [due, total, learned] = await Promise.all([
    dueCount(user, now),
    ReviewItem.countDocuments({ userId: uid(user), archived: false }),
    ReviewItem.countDocuments({ userId: uid(user), archived: false, "card.state": 2, "card.stability": { $gte: 21 } }),
  ]);
  return { due, total, learned };
}

export async function dueQueue(user: CurrentUser, limit = SESSION_SIZE, now = new Date()): Promise<ReviewCard[]> {
  const items = await ReviewItem.find({ userId: uid(user), archived: false, "card.due": { $lte: now } })
    .sort({ "card.due": 1 })
    .limit(limit)
    .lean<ReviewItemDoc[]>();
  return items.map(toCard);
}

export async function reviewScript(user: CurrentUser, itemId: string): Promise<string | null> {
  const item = await ReviewItem.findOne(itemFilter(user, itemId)).select("question.audioScript").lean<ReviewItemDoc>();
  if (!item) throw new ApiError("not_found", "That review card doesn't exist.");
  return item.question?.audioScript || null;
}

/** Re-answer a card. Wrong → scheduled as "again" right away; right → the learner picks how hard it felt. */
export async function answerReview(user: CurrentUser, itemId: string, response: Response): Promise<ReviewReveal> {
  const filter = itemFilter(user, itemId);
  const item = await ReviewItem.findOne(filter).lean<ReviewItemDoc>();
  if (!item) throw new ApiError("not_found", "That review card doesn't exist.");
  const q = normalizeStoredQuestion(item.question);
  const isCorrect = grade(q, response);
  const now = new Date();

  const answered: StoredQuestion = {
    ...blankQuestion(q),
    userChoice: "choice" in response ? response.choice : null,
    userText: "text" in response ? response.text : null,
    isCorrect,
    answeredAt: now,
  };

  let scheduledFor: string | null = null;
  if (!isCorrect) {
    const card = gradeCard(item.card, "again", now);
    await ReviewItem.updateOne(filter, { $set: { card, lastResult: "again" } });
    scheduledFor = card.due.toISOString();
  }

  await Promise.allSettled([
    recordActivity(user.id, user.settings.timezone, { reviews: 1 }, now),
    recordMastery(user.id, [{ point: q.point, kind: q.pointKind, level: item.level, correct: isCorrect }], now),
  ]);

  const intervals = isCorrect ? previewIntervals(item.card, now) : null;
  return {
    isCorrect,
    question: toView(answered, "practice", "completed"),
    original: { choice: q.userChoice, text: q.userText },
    intervals: intervals
      ? {
          again: humanInterval(now, intervals.again),
          hard: humanInterval(now, intervals.hard),
          good: humanInterval(now, intervals.good),
          easy: humanInterval(now, intervals.easy),
        }
      : null,
    scheduledFor,
  };
}

export async function gradeReview(user: CurrentUser, itemId: string, rating: Exclude<ReviewRating, "again">) {
  const filter = itemFilter(user, itemId);
  const item = await ReviewItem.findOne(filter).select("card").lean<ReviewItemDoc>();
  if (!item) throw new ApiError("not_found", "That review card doesn't exist.");
  const card = gradeCard(item.card, rating);
  await ReviewItem.updateOne(filter, { $set: { card, lastResult: rating } });
  return { due: card.due.toISOString() };
}

export async function setArchived(user: CurrentUser, itemId: string, archived: boolean) {
  const res = await ReviewItem.updateOne(itemFilter(user, itemId), { $set: { archived } });
  if (res.matchedCount === 0) throw new ApiError("not_found", "That review card doesn't exist.");
}

export async function library(
  user: CurrentUser,
  opts: { before?: string | null; section?: Section | null; archived?: boolean; q?: string | null; limit?: number } = {}
): Promise<{ items: LibraryItem[]; nextCursor: string | null }> {
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const filter: Record<string, unknown> = { userId: uid(user), archived: !!opts.archived };
  if (opts.section) filter["question.section"] = opts.section;
  if (opts.before) {
    const d = new Date(opts.before);
    if (!Number.isNaN(d.getTime())) filter.createdAt = { $lt: d };
  }
  if (opts.q?.trim()) {
    const rx = new RegExp(opts.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 60), "i");
    filter.$or = [{ "question.prompt": rx }, { "question.point": rx }, { "question.gloss": rx }, { "question.passage": rx }];
  }
  const rows = await ReviewItem.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean<ReviewItemDoc[]>();
  const page = rows.slice(0, limit);
  return {
    items: page.map((item) => ({
      id: String(item._id),
      paperId: String(item.paperId),
      level: item.level,
      createdAt: new Date(item.createdAt).toISOString(),
      due: new Date(item.card.due).toISOString(),
      archived: item.archived,
      lapses: item.card.lapses,
      reps: item.card.reps,
      question: toView(normalizeStoredQuestion(item.question), "practice", "completed"),
    })),
    nextCursor: rows.length > limit ? new Date(page[page.length - 1].createdAt).toISOString() : null,
  };
}
