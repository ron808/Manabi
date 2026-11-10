import { describe, expect, it } from "vitest";
import { fromLegacy, grade, normalizeStoredQuestion, toView, type StoredQuestion } from "@/lib/domain/question";

const base: StoredQuestion = {
  id: 1,
  section: "grammar",
  format: "grammar_form",
  point: "で — place of action",
  pointKind: "grammar",
  passage: null,
  audioScript: null,
  prompt: "{駅|えき}（　　）{会|あ}いました。",
  options: ["で", "を", "へ", "が"],
  answerIndex: 0,
  answerText: null,
  acceptedAnswers: [],
  keepScript: false,
  explanationEn: "で marks where an action happens.",
  explanationJp: "",
  gloss: "I met (someone) at the station.",
  userChoice: null,
  userText: null,
  isCorrect: null,
  answeredAt: null,
  guessed: false,
  flagged: false,
  tutor: [],
};

describe("redaction", () => {
  it("hides answers for unanswered practice questions", () => {
    const v = toView(base, "practice", "in_progress");
    expect(v.answerIndex).toBeNull();
    expect(v.explanationEn).toBeNull();
    expect(v.point).toBeNull();
    expect(v.revealed).toBe(false);
  });

  it("reveals a practice question once answered", () => {
    const v = toView({ ...base, userChoice: 1, isCorrect: false }, "practice", "in_progress");
    expect(v.answerIndex).toBe(0);
    expect(v.isCorrect).toBe(false);
  });

  it("reveals nothing in exam mode until the paper is completed", () => {
    const answered = { ...base, userChoice: 0, isCorrect: true };
    expect(toView(answered, "exam", "in_progress").answerIndex).toBeNull();
    expect(toView(answered, "exam", "in_progress").isCorrect).toBeNull();
    expect(toView(answered, "exam", "completed").answerIndex).toBe(0);
  });

  it("never exposes a listening script before the answer", () => {
    const listening = { ...base, section: "listening" as const, audioScript: "男：こんにちは。" };
    const v = toView(listening, "practice", "in_progress");
    expect(v.audioScript).toBeNull();
    expect(v.hasAudio).toBe(true);
  });
});

describe("grading", () => {
  it("grades choices by index", () => {
    expect(grade(base, { choice: 0 })).toBe(true);
    expect(grade(base, { choice: 2 })).toBe(false);
  });

  it("grades typed answers with normalisation", () => {
    const typed = { ...base, options: [], answerIndex: null, answerText: "読みました", acceptedAnswers: ["よみました"] };
    expect(grade(typed, { text: "ヨミマシタ" })).toBe(true);
    expect(grade(typed, { text: "よみます" })).toBe(false);
  });
});

describe("legacy papers", () => {
  it("converts v1 letter-prefixed questions", () => {
    const q = fromLegacy({
      id: 3,
      format: "Particle fill-in-the-blank",
      questionJp: "駅___会いました。",
      passageJp: null,
      options: ["A: で", "B: を", "C: へ", "D: が"],
      correctAnswer: "A",
      explanationJp: "",
      explanationEn: "で for place of action.",
      englishGloss: "Met at the station.",
      userAnswer: "C",
      isCorrect: false,
      answeredAt: null,
    });
    expect(q.options).toEqual(["で", "を", "へ", "が"]);
    expect(q.answerIndex).toBe(0);
    expect(q.userChoice).toBe(2);
    expect(q.format).toBe("grammar_form");
    expect(q.section).toBe("grammar");
  });

  it("passes v2 questions through with defaults", () => {
    const { tutor: _t, ...rest } = base;
    expect(normalizeStoredQuestion(rest).tutor).toEqual([]);
  });
});
