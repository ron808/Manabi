import { describe, expect, it } from "vitest";
import { localVerdict } from "@/lib/client/localGrade";
import { toView, type StoredQuestion } from "@/lib/domain/question";
import { answerCheck, withCheck } from "@/lib/server/check";

const mc: StoredQuestion = {
  id: 1,
  section: "grammar",
  format: "grammar_form",
  point: "で",
  pointKind: "grammar",
  passage: null,
  audioScript: null,
  prompt: "{駅|えき}（　　）{会|あ}う",
  options: ["を", "で", "へ", "が"],
  answerIndex: 1,
  answerText: null,
  acceptedAnswers: [],
  keepScript: false,
  explanationEn: "x",
  explanationJp: "",
  gloss: "",
  userChoice: null,
  userText: null,
  isCorrect: null,
  answeredAt: null,
  guessed: false,
  flagged: false,
  tutor: [],
};

const typed: StoredQuestion = { ...mc, options: [], answerIndex: null, answerText: "読みました", acceptedAnswers: ["よみました"] };

describe("instant practice marking", () => {
  it("finds the right option on the device without revealing it in the view", async () => {
    const view = withCheck(toView(mc, "practice", "in_progress"), mc, "practice");
    expect(view.answerIndex).toBeNull();
    expect(JSON.stringify(view)).not.toContain('"answerIndex":1');
    expect(await localVerdict(view, { choice: 0 })).toEqual({ isCorrect: false, answerIndex: 1 });
    expect(await localVerdict(view, { choice: 1 })).toEqual({ isCorrect: true, answerIndex: 1 });
  });

  it("marks typed answers with the same normalisation as the server", async () => {
    const view = withCheck(toView(typed, "practice", "in_progress"), typed, "practice");
    expect((await localVerdict(view, { text: "ヨミマシタ" }))?.isCorrect).toBe(true);
    expect((await localVerdict(view, { text: "よみます" }))?.isCorrect).toBe(false);
  });

  it("never sends a check in exam mode or once answered", () => {
    expect(withCheck(toView(mc, "exam", "in_progress"), mc, "exam").check).toBeUndefined();
    const answered = { ...mc, userChoice: 0, isCorrect: false };
    expect(withCheck(toView(answered, "practice", "in_progress"), answered, "practice").check).toBeUndefined();
  });

  it("salts every check differently", () => {
    expect(answerCheck(mc)!.hashes[0]).not.toBe(answerCheck(mc)!.hashes[0]);
  });
});
