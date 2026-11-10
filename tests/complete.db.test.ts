import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Paper } from "@/lib/db/models/Paper";
import { ReviewItem } from "@/lib/db/models/ReviewItem";
import { User } from "@/lib/db/models/User";
import { Activity } from "@/lib/db/models/Activity";
import type { StoredQuestion } from "@/lib/domain/question";
import { answerQuestion, completePaper, createPaper, openPaper } from "@/lib/server/papers";
import type { CurrentUser } from "@/lib/server/session";

// Runs against a local MongoDB (manabi_test). Skipped if none is reachable.
let available = true;
let user: CurrentUser;

const q = (id: number, answerIndex: number): StoredQuestion => ({
  id,
  section: "grammar",
  format: "grammar_form",
  point: `point ${id}`,
  pointKind: "grammar",
  passage: null,
  audioScript: null,
  prompt: "{駅|えき}（　　）{会|あ}う",
  options: ["で", "を", "へ", "が"],
  answerIndex,
  answerText: null,
  acceptedAnswers: [],
  keepScript: false,
  explanationEn: "because",
  explanationJp: "",
  gloss: "",
  userChoice: null,
  userText: null,
  isCorrect: null,
  answeredAt: null,
  guessed: false,
  flagged: false,
  tutor: [],
});

beforeAll(async () => {
  try {
    await connectDB();
    await mongoose.connection.db!.dropDatabase();
    const u = await User.create({ name: "Test", email: `t${Date.now()}@example.test`, passwordHash: "x" });
    user = {
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      settings: { targetLevel: null, examDate: null, dailyGoal: 20, furigana: true, timezone: "UTC" },
    };
  } catch {
    available = false;
  }
});

afterAll(async () => {
  if (available) await mongoose.disconnect();
});

describe("paper lifecycle", () => {
  beforeEach((ctx) => {
    if (!available) ctx.skip();
  });

  it("counts a paper exactly once even when completed twice at the same moment", async () => {
    const id = await createPaper(user, {
      mode: "practice",
      source: "custom",
      config: { level: "N5", difficulty: 3, formats: ["grammar_form"], customInstructions: "", questionCount: 3, timeLimitMinutes: null, focusPoints: [] },
      questions: [q(1, 0), q(2, 1), q(3, 2)],
    });
    await openPaper(user, id);
    await answerQuestion(user, id, 1, { choice: 0 });
    await answerQuestion(user, id, 2, { choice: 3 });

    const [a, b] = await Promise.all([completePaper(user, id), completePaper(user, id)]);
    expect([a.transitioned, b.transitioned].filter(Boolean)).toHaveLength(1);

    const paper = await Paper.findById(id).lean();
    expect(paper!.status).toBe("completed");
    expect(paper!.score).toBe(1);

    const u = await User.findById(user.id).lean();
    expect(u!.totalPapers).toBe(1);
    expect(u!.totalCorrect).toBe(1);
    expect(u!.totalQuestions).toBe(2);

    const reviews = await ReviewItem.find({ userId: user.id }).lean();
    expect(reviews.map((r) => r.questionId)).toEqual([2]);

    const activity = await Activity.find({ userId: user.id }).lean();
    expect(activity).toHaveLength(1);
    expect(activity[0].papers).toBe(1);
  });

  it("rejects answers after completion and keeps practice answers final", async () => {
    const id = await createPaper(user, {
      mode: "practice",
      source: "custom",
      config: { level: "N5", difficulty: 3, formats: ["grammar_form"], customInstructions: "", questionCount: 1, timeLimitMinutes: null, focusPoints: [] },
      questions: [q(1, 0)],
    });
    await openPaper(user, id);
    await answerQuestion(user, id, 1, { choice: 2 });
    const second = await answerQuestion(user, id, 1, { choice: 0 });
    expect(second.question.userChoice).toBe(2);
    await completePaper(user, id);
    await expect(answerQuestion(user, id, 1, { choice: 0 })).rejects.toThrow(/finished/);
  });

  it("hands in a timed paper once its deadline has passed", async () => {
    const id = await createPaper(user, {
      mode: "exam",
      source: "custom",
      config: { level: "N5", difficulty: 3, formats: ["grammar_form"], customInstructions: "", questionCount: 1, timeLimitMinutes: 1, focusPoints: [] },
      questions: [q(1, 0)],
    });
    await openPaper(user, id);
    await Paper.updateOne({ _id: id }, { $set: { deadlineAt: new Date(Date.now() - 60_000) } });
    const reopened = await openPaper(user, id);
    expect(reopened!.status).toBe("completed");
    expect(reopened!.timeTakenSeconds).toBeLessThanOrEqual(60);
  });
});
