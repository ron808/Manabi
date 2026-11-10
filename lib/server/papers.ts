import mongoose from "mongoose";
import { ApiError } from "@/lib/api/errors";
import { Paper, type PaperConfig, type PaperDoc, type PaperSource } from "@/lib/db/models/Paper";
import { User } from "@/lib/db/models/User";
import {
  grade,
  isAnswered,
  normalizeStoredQuestion,
  toView,
  type PaperMode,
  type PaperStatus,
  type QuestionView,
  type Response,
  type StoredQuestion,
} from "@/lib/domain/question";
import { withCheck } from "./check";
import { createReviewItems, recordActivity, recordMastery } from "./learning";
import type { CurrentUser } from "./session";

/** Answers are still accepted this long after the deadline (network lag). */
const GRACE_MS = 30_000;

export interface PaperView {
  id: string;
  mode: PaperMode;
  source: PaperSource;
  status: PaperStatus;
  config: PaperConfig;
  createdAt: string;
  startedAt: string | null;
  deadlineAt: string | null;
  completedAt: string | null;
  timeTakenSeconds: number | null;
  score: number | null;
  totalQuestions: number;
  questions: QuestionView[];
  /** Lets the client correct its clock for the timer. */
  serverNow: string;
}

export interface PaperSummary {
  id: string;
  mode: PaperMode;
  source: PaperSource;
  status: PaperStatus;
  level: string;
  difficulty: number;
  formats: string[];
  createdAt: string;
  completedAt: string | null;
  score: number | null;
  totalQuestions: number;
  answered: number;
  timeTakenSeconds: number | null;
}

type LeanPaper = Omit<PaperDoc, "questions"> & { questions: unknown[] };

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);

function normalizePaper(p: LeanPaper): PaperDoc {
  return {
    ...p,
    mode: p.mode ?? "practice",
    source: p.source ?? "custom",
    deadlineAt: p.deadlineAt ?? null,
    config: {
      ...p.config,
      focusPoints: p.config?.focusPoints ?? [],
      timeLimitMinutes: p.config?.timeLimitMinutes ?? null,
    },
    questions: (p.questions ?? []).map(normalizeStoredQuestion),
  };
}

export function toPaperView(p: PaperDoc): PaperView {
  return {
    id: String(p._id),
    mode: p.mode,
    source: p.source,
    status: p.status,
    config: p.config,
    createdAt: iso(p.createdAt)!,
    startedAt: iso(p.startedAt),
    deadlineAt: iso(p.deadlineAt),
    completedAt: iso(p.completedAt),
    timeTakenSeconds: p.timeTakenSeconds ?? null,
    score: p.score ?? null,
    totalQuestions: p.totalQuestions,
    questions: p.questions.map((q) => withCheck(toView(q, p.mode, p.status), q, p.mode)),
    serverNow: new Date().toISOString(),
  };
}

function paperFilter(user: CurrentUser, paperId: string) {
  if (!mongoose.isValidObjectId(paperId)) throw new ApiError("not_found", "That paper doesn't exist.");
  return { _id: new mongoose.Types.ObjectId(paperId), userId: new mongoose.Types.ObjectId(user.id) };
}

export async function getPaperDoc(user: CurrentUser, paperId: string): Promise<PaperDoc | null> {
  const p = await Paper.findOne(paperFilter(user, paperId)).lean<LeanPaper>();
  return p ? normalizePaper(p) : null;
}

const expired = (p: Pick<PaperDoc, "deadlineAt">, now = Date.now()) =>
  p.deadlineAt != null && now > new Date(p.deadlineAt).getTime() + GRACE_MS;

/**
 * Loads a paper for sitting. Starts the clock on first open, upgrades a v1
 * paper being resumed, and closes a paper whose time already ran out.
 */
export async function openPaper(user: CurrentUser, paperId: string): Promise<PaperDoc | null> {
  const filter = paperFilter(user, paperId);
  const raw = await Paper.findOne(filter).lean<LeanPaper>();
  if (!raw) return null;
  let paper = normalizePaper(raw);

  if (paper.status !== "completed" && raw.schemaVersion !== 2) {
    await Paper.updateOne(filter, { $set: { questions: paper.questions, schemaVersion: 2, mode: paper.mode } });
  }

  if (paper.status === "generated") {
    const now = new Date();
    const limit = paper.config.timeLimitMinutes;
    const deadlineAt = limit ? new Date(now.getTime() + limit * 60_000) : null;
    const res = await Paper.updateOne(
      { ...filter, status: "generated" },
      { $set: { status: "in_progress", startedAt: now, deadlineAt } }
    );
    if (res.modifiedCount === 1) paper = { ...paper, status: "in_progress", startedAt: now, deadlineAt };
    else return openPaper(user, paperId);
  }

  if (paper.status === "in_progress" && expired(paper)) {
    const done = await completePaper(user, paperId);
    return done.paper;
  }
  return paper;
}

export async function createPaper(
  user: CurrentUser,
  input: { mode: PaperMode; source: PaperSource; config: PaperConfig; questions: StoredQuestion[] }
): Promise<string> {
  const paper = await Paper.create({
    userId: user.id,
    schemaVersion: 2,
    mode: input.mode,
    source: input.source,
    config: input.config,
    questions: input.questions,
    status: "generated",
    totalQuestions: input.questions.length,
  });
  return paper._id.toString();
}

export async function answerQuestion(
  user: CurrentUser,
  paperId: string,
  questionId: number,
  response: Response,
  opts: { guessed?: boolean } = {}
): Promise<{ question: QuestionView; completed: boolean }> {
  const filter = paperFilter(user, paperId);
  const lite = await Paper.findOne(
    { ...filter, "questions.id": questionId },
    { "questions.$": 1, status: 1, mode: 1, deadlineAt: 1 }
  ).lean<LeanPaper>();
  if (!lite) throw new ApiError("not_found", "That question doesn't exist.");
  const mode: PaperMode = lite.mode ?? "practice";
  if (lite.status === "completed") throw new ApiError("conflict", "This paper is already finished.");
  if (lite.status === "generated") throw new ApiError("conflict", "Open the paper before answering.");
  if (expired(lite)) {
    await completePaper(user, paperId);
    throw new ApiError("gone", "Time's up — the paper has been handed in.");
  }

  const q = normalizeStoredQuestion(lite.questions[0]);
  if (mode === "practice" && isAnswered(q)) {
    return { question: toView(q, mode, "in_progress"), completed: false };
  }
  if ("choice" in response && (q.options.length === 0 || response.choice >= q.options.length)) {
    throw new ApiError("bad_request", "That option doesn't exist.");
  }
  if ("text" in response && q.options.length > 0) {
    throw new ApiError("bad_request", "Choose one of the options.");
  }

  const isCorrect = grade(q, response);
  const now = new Date();
  const set = {
    "questions.$[q].userChoice": "choice" in response ? response.choice : null,
    "questions.$[q].userText": "text" in response ? response.text : null,
    "questions.$[q].isCorrect": isCorrect,
    "questions.$[q].answeredAt": now,
    "questions.$[q].guessed": mode === "practice" && !!opts.guessed,
  };
  // Practice answers are final: only write if the question is still unanswered.
  const arrayFilter =
    mode === "practice"
      ? { "q.id": questionId, "q.userChoice": null, "q.userText": null }
      : { "q.id": questionId };
  await Paper.updateOne(
    { ...filter, status: "in_progress" },
    { $set: set },
    { arrayFilters: [arrayFilter] }
  );

  const updated: StoredQuestion = {
    ...q,
    userChoice: "choice" in response ? response.choice : null,
    userText: "text" in response ? response.text : null,
    isCorrect,
    answeredAt: now,
    guessed: mode === "practice" && !!opts.guessed,
  };
  return { question: toView(updated, mode, "in_progress"), completed: false };
}

export async function setFlag(user: CurrentUser, paperId: string, questionId: number, flagged: boolean) {
  const res = await Paper.updateOne(
    { ...paperFilter(user, paperId), "questions.id": questionId },
    { $set: { "questions.$.flagged": flagged } }
  );
  if (res.matchedCount === 0) throw new ApiError("not_found", "That question doesn't exist.");
}

/**
 * Hands a paper in. The status flip, score and time are computed in one
 * atomic update, and the stats / review side effects run only for the call
 * that actually made the transition — so double submits can't double-count.
 */
export async function completePaper(
  user: CurrentUser,
  paperId: string
): Promise<{ paper: PaperDoc; transitioned: boolean }> {
  const filter = paperFilter(user, paperId);
  const updated = await Paper.findOneAndUpdate(
    { ...filter, status: { $ne: "completed" } },
    [
      {
        $set: {
          status: "completed",
          completedAt: "$$NOW",
          score: {
            $size: { $filter: { input: "$questions", cond: { $eq: ["$$this.isCorrect", true] } } },
          },
          timeTakenSeconds: {
            $max: [
              0,
              {
                $dateDiff: {
                  startDate: { $ifNull: ["$startedAt", "$createdAt"] },
                  endDate: "$$NOW",
                  unit: "second",
                },
              },
            ],
          },
        },
      },
      {
        $set: {
          timeTakenSeconds: {
            $cond: [
              { $gt: [{ $ifNull: ["$config.timeLimitMinutes", 0] }, 0] },
              { $min: ["$timeTakenSeconds", { $multiply: ["$config.timeLimitMinutes", 60] }] },
              "$timeTakenSeconds",
            ],
          },
        },
      },
    ],
    { returnDocument: "after", lean: true, updatePipeline: true }
  ).lean<LeanPaper>();

  if (!updated) {
    const existing = await getPaperDoc(user, paperId);
    if (!existing) throw new ApiError("not_found", "That paper doesn't exist.");
    return { paper: existing, transitioned: false };
  }

  const paper = normalizePaper(updated);
  await afterCompletion(user, paper);
  return { paper, transitioned: true };
}

async function afterCompletion(user: CurrentUser, paper: PaperDoc) {
  const answered = paper.questions.filter(isAnswered);
  const score = paper.score ?? 0;
  const at = paper.completedAt ? new Date(paper.completedAt) : new Date();
  const toReview = answered.filter((q) => q.isCorrect === false || (paper.mode === "practice" && q.guessed));

  const results = await Promise.allSettled([
    User.updateOne(
      { _id: user.id },
      { $inc: { totalPapers: 1, totalCorrect: score, totalQuestions: answered.length } }
    ),
    recordActivity(user.id, user.settings.timezone, { answered: answered.length, correct: score, papers: 1 }, at),
    recordMastery(
      user.id,
      answered.map((q) => ({ point: q.point, kind: q.pointKind, level: paper.config.level, correct: q.isCorrect === true })),
      at
    ),
    createReviewItems(user.id, paper._id, paper.config.level, toReview, at),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("[manabi] post-completion step failed", r.reason);
  }
}

export async function listPapers(
  user: CurrentUser,
  opts: {
    before?: string | null;
    limit?: number;
    level?: string | null;
    mode?: PaperMode | null;
    status?: PaperStatus[];
  } = {}
): Promise<{ papers: PaperSummary[]; nextCursor: string | null }> {
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const q: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(user.id) };
  if (opts.before) {
    const d = new Date(opts.before);
    if (!Number.isNaN(d.getTime())) q.createdAt = { $lt: d };
  }
  if (opts.level) q["config.level"] = opts.level;
  if (opts.mode === "exam") q.mode = "exam";
  if (opts.mode === "practice") q.mode = { $ne: "exam" };
  if (opts.status?.length) q.status = { $in: opts.status };

  const rows = await Paper.aggregate<{
    _id: mongoose.Types.ObjectId;
    mode?: PaperMode;
    source?: PaperSource;
    status: PaperStatus;
    config: PaperConfig;
    createdAt: Date;
    completedAt: Date | null;
    score: number | null;
    totalQuestions: number;
    timeTakenSeconds: number | null;
    answered: number;
  }>([
    { $match: q },
    { $sort: { createdAt: -1 } },
    { $limit: limit + 1 },
    {
      $project: {
        mode: 1,
        source: 1,
        status: 1,
        config: 1,
        createdAt: 1,
        completedAt: 1,
        score: 1,
        totalQuestions: 1,
        timeTakenSeconds: 1,
        answered: {
          $size: {
            $filter: {
              input: "$questions",
              cond: {
                $or: [
                  { $ne: [{ $ifNull: ["$$this.userChoice", null] }, null] },
                  { $ne: [{ $ifNull: ["$$this.userText", null] }, null] },
                  { $ne: [{ $ifNull: ["$$this.userAnswer", null] }, null] },
                ],
              },
            },
          },
        },
      },
    },
  ]);

  const page = rows.slice(0, limit);
  return {
    papers: page.map((p) => ({
      id: String(p._id),
      mode: p.mode ?? "practice",
      source: p.source ?? "custom",
      status: p.status,
      level: p.config?.level ?? "",
      difficulty: p.config?.difficulty ?? 3,
      formats: p.config?.formats ?? [],
      createdAt: iso(p.createdAt)!,
      completedAt: iso(p.completedAt),
      score: p.score ?? null,
      totalQuestions: p.totalQuestions,
      answered: p.answered,
      timeTakenSeconds: p.timeTakenSeconds ?? null,
    })),
    nextCursor: rows.length > limit ? iso(page[page.length - 1].createdAt) : null,
  };
}

export async function latestInProgress(user: CurrentUser): Promise<PaperSummary | null> {
  const { papers } = await listPapers(user, { limit: 1, status: ["generated", "in_progress"] });
  return papers[0] ?? null;
}

/** Stores one tutor exchange on the question (kept short). */
export async function appendTutorTurns(
  user: CurrentUser,
  paperId: string,
  questionId: number,
  turns: { role: "user" | "assistant"; content: string }[]
) {
  await Paper.updateOne(
    { ...paperFilter(user, paperId), "questions.id": questionId },
    { $push: { "questions.$.tutor": { $each: turns, $slice: -12 } } }
  );
}
