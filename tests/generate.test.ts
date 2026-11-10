import { describe, expect, it } from "vitest";
import { planSlots, prepare, shuffleOptions } from "@/lib/ai/generate";
import type { GeneratedQuestion } from "@/lib/ai/schema";

const good: GeneratedQuestion = {
  format: "grammar_form",
  point: "で — place of action",
  passage: null,
  audioScript: null,
  prompt: "{駅|えき}（　　）{友|とも}だちに{会|あ}いました。",
  options: ["で", "を", "へ", "が"],
  answerIndex: 0,
  answerText: null,
  acceptedAnswers: [],
  explanationEn: "で marks where an action happens.",
  explanationJp: "{場所|ばしょ}には「で」。",
  gloss: "I met a friend at the station.",
};

describe("planSlots", () => {
  it("spreads formats evenly", () => {
    expect(planSlots(["a_unknown", "kanji_reading", "grammar_form"], 5)).toEqual([
      "kanji_reading",
      "grammar_form",
      "kanji_reading",
      "grammar_form",
      "kanji_reading",
    ]);
  });
});

describe("shuffleOptions", () => {
  it("keeps the answer pointing at the same text", () => {
    for (let i = 0; i < 50; i++) {
      const { options, answerIndex } = shuffleOptions(["a", "b", "c", "d"], 2);
      expect(options[answerIndex]).toBe("c");
      expect([...options].sort()).toEqual(["a", "b", "c", "d"]);
    }
  });
});

describe("prepare", () => {
  it("accepts a well-formed question and keeps the answer aligned", () => {
    const p = prepare(good, "grammar_form");
    expect(p).not.toBeNull();
    expect(p!.q.options[p!.q.answerIndex!]).toBe("で");
  });

  it("rejects duplicate options", () => {
    expect(prepare({ ...good, options: ["で", "で", "へ", "が"] }, "grammar_form")).toBeNull();
  });

  it("rejects a missing answer and the wrong option count", () => {
    expect(prepare({ ...good, answerIndex: null }, "grammar_form")).toBeNull();
    expect(prepare({ ...good, options: ["で", "を", "へ"] }, "grammar_form")).toBeNull();
  });

  it("strips numbering the model added to options", () => {
    const p = prepare({ ...good, options: ["1. で", "2. を", "3. へ", "4. が"] }, "grammar_form");
    expect(p!.q.options.sort()).toEqual(["が", "で", "へ", "を"].sort());
  });

  it("requires a script for listening questions and moves text out of passage", () => {
    expect(prepare({ ...good, format: "listening_point" }, "listening_point")).toBeNull();
    const p = prepare({ ...good, format: "listening_point", audioScript: "男：{駅|えき}で{会|あ}おう。" }, "listening_point");
    expect(p!.q.audioScript).toContain("男");
    expect(p!.q.passage).toBeNull();
  });

  it("handles typed recall answers", () => {
    const p = prepare(
      { ...good, format: "recall_reading", options: [], answerIndex: null, answerText: "えいが", acceptedAnswers: [] },
      "recall_reading"
    );
    expect(p!.q.answerText).toBe("えいが");
    expect(p!.q.options).toEqual([]);
  });

  it("rejects questions with no Japanese at all", () => {
    expect(prepare({ ...good, prompt: "Choose the particle." }, "grammar_form")).toBeNull();
  });
});
