import mongoose from "mongoose";
import { Activity } from "@/lib/db/models/Activity";
import { Mastery } from "@/lib/db/models/Mastery";
import { Paper } from "@/lib/db/models/Paper";
import { addDays, currentStreak, dayKey, daysUntil, longestStreak } from "@/lib/domain/dates";
import { isLevel, type Level } from "@/lib/domain/jlpt";
import { masteryScore } from "@/lib/domain/points";
import { deckCounts } from "./reviews";
import { latestInProgress, listPapers, type PaperSummary } from "./papers";
import type { CurrentUser } from "./session";

export const HEATMAP_WEEKS = 18;

export interface WeakPoint {
  key: string;
  label: string;
  kind: string;
  level: string;
  seen: number;
  correct: number;
  score: number;
}

export interface TodaySummary {
  today: string;
  streak: number;
  bestStreak: number;
  doneToday: number;
  dailyGoal: number;
  examDate: string | null;
  examInDays: number | null;
  reviews: { due: number; total: number; learned: number };
  heatmap: { day: string; count: number }[];
  weakest: WeakPoint[];
  inProgress: PaperSummary | null;
  recent: PaperSummary[];
  level: Level;
}

export async function weakestPoints(user: CurrentUser, limit = 5, level?: string | null): Promise<WeakPoint[]> {
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(user.id), seen: { $gte: 1 } };
  if (level) filter.level = level;
  const rows = await Mastery.find(filter).sort({ lastSeenAt: -1 }).limit(300).lean();
  return rows
    .map((m) => {
      // Recent results count double: a point you've just started getting right is improving.
      const recentRight = (m.recent ?? []).reduce((a, b) => a + b, 0);
      const score = masteryScore(m.seen + (m.recent?.length ?? 0), m.correct + recentRight);
      return { key: m.key, label: m.label, kind: m.kind, level: m.level, seen: m.seen, correct: m.correct, score };
    })
    .filter((p) => p.score < 0.75)
    .sort((a, b) => a.score - b.score || b.seen - a.seen)
    .slice(0, limit);
}

/** The level to aim new material at: the learner's target, else what they practise most. */
export async function workingLevel(user: CurrentUser): Promise<Level> {
  if (isLevel(user.settings.targetLevel)) return user.settings.targetLevel;
  const last = await Paper.findOne({ userId: user.id }).sort({ createdAt: -1 }).select("config.level").lean();
  const lvl = last?.config?.level;
  return isLevel(lvl) ? lvl : "N5";
}

/** Keeps practice in the sweet spot: recent accuracy high → harder, low → easier. */
export async function adaptiveDifficulty(user: CurrentUser, level: Level): Promise<number> {
  const recent = await Paper.find({ userId: user.id, status: "completed", "config.level": level })
    .sort({ completedAt: -1 })
    .limit(3)
    .select("score totalQuestions config.difficulty")
    .lean();
  if (!recent.length) return 3;
  const acc = recent.reduce((a, p) => a + (p.score ?? 0), 0) / Math.max(1, recent.reduce((a, p) => a + p.totalQuestions, 0));
  const base = recent[0].config?.difficulty ?? 3;
  if (acc >= 0.85) return Math.min(5, base + 1);
  if (acc <= 0.55) return Math.max(1, base - 1);
  return base;
}

export async function todaySummary(user: CurrentUser): Promise<TodaySummary> {
  const today = dayKey(new Date(), user.settings.timezone);
  const since = addDays(today, -(HEATMAP_WEEKS * 7 + 7));

  const [activity, allDays, reviews, weakest, inProgress, recent, level] = await Promise.all([
    Activity.find({ userId: user.id, day: { $gte: since } }).select("day answered reviews").lean(),
    Activity.find({ userId: user.id }).sort({ day: -1 }).limit(800).select("day").lean(),
    deckCounts(user),
    weakestPoints(user, 5),
    latestInProgress(user),
    listPapers(user, { limit: 5 }),
    workingLevel(user),
  ]);

  const counts = new Map(activity.map((a) => [a.day, (a.answered ?? 0) + (a.reviews ?? 0)]));
  const heatmap: { day: string; count: number }[] = [];
  for (let i = HEATMAP_WEEKS * 7 - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    heatmap.push({ day, count: counts.get(day) ?? 0 });
  }
  const days = allDays.map((a) => a.day);
  const examDate = user.settings.examDate;
  const examInDays = examDate ? daysUntil(examDate, today) : null;

  return {
    today,
    streak: currentStreak(days, today),
    bestStreak: longestStreak(days),
    doneToday: counts.get(today) ?? 0,
    dailyGoal: user.settings.dailyGoal ?? 20,
    examDate,
    examInDays: examInDays != null && examInDays >= 0 ? examInDays : null,
    reviews,
    heatmap,
    weakest,
    inProgress,
    recent: recent.papers,
    level,
  };
}
