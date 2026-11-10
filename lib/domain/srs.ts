import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";

// Spaced repetition (FSRS). A review item keeps its card state; every grade
// moves `due` forward (or back to soon, on a miss).

// Day-based steps: Manabi is a daily habit, and a miss already returns once
// more within the same session (see ReviewSession).
const scheduler = fsrs(
  generatorParameters({ request_retention: 0.9, enable_fuzz: true, maximum_interval: 365, enable_short_term: false })
);

export interface CardState {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: Date | null;
}

export type ReviewRating = "again" | "hard" | "good" | "easy";

const RATING: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

function toCard(s: CardState): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsedDays,
    scheduled_days: s.scheduledDays,
    learning_steps: s.learningSteps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    last_review: s.lastReview ? new Date(s.lastReview) : undefined,
  };
}

function fromCard(c: Card): CardState {
  return {
    due: c.due,
    stability: c.stability,
    difficulty: c.difficulty,
    elapsedDays: c.elapsed_days,
    scheduledDays: c.scheduled_days,
    learningSteps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    lastReview: c.last_review ?? null,
  };
}

export function newCardState(now = new Date()): CardState {
  return fromCard(createEmptyCard(now));
}

export function gradeCard(state: CardState, rating: ReviewRating, now = new Date()): CardState {
  return fromCard(scheduler.next(toCard(state), now, RATING[rating]).card);
}

/** Next due date for each rating — shown on the grade buttons ("Good · 3d"). */
export function previewIntervals(state: CardState, now = new Date()): Record<ReviewRating, Date> {
  const out = {} as Record<ReviewRating, Date>;
  for (const r of Object.keys(RATING) as ReviewRating[]) {
    out[r] = scheduler.next(toCard(state), now, RATING[r]).card.due;
  }
  return out;
}

export function humanInterval(from: Date, to: Date): string {
  const mins = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days}d`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.round(days / 365)}y`;
}

/** Mature cards (long stability) count as "known" for progress displays. */
export function isMature(state: Pick<CardState, "stability" | "state">): boolean {
  return state.state === State.Review && state.stability >= 21;
}
