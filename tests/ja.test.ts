import { describe, expect, it } from "vitest";
import { answersMatch, normalizeAnswer } from "@/lib/ja/normalize";
import { parseRuby, plainText, sanitizeRuby, spokenText } from "@/lib/ja/ruby";

describe("ruby markup", () => {
  it("parses annotated and plain segments", () => {
    expect(parseRuby("{駅|えき}で{友|とも}だちに")).toEqual([
      { text: "駅", reading: "えき" },
      { text: "で" },
      { text: "友", reading: "とも" },
      { text: "だちに" },
    ]);
  });

  it("strips to base text or readings", () => {
    expect(plainText("{駅|えき}に{行|い}く")).toBe("駅に行く");
    expect(spokenText("{駅|えき}に{行|い}く")).toBe("えきにいく");
  });

  it("drops readings that aren't kana or bases without kanji", () => {
    expect(sanitizeRuby("{駅|eki}に")).toBe("駅に");
    expect(sanitizeRuby("{えき|えき}に")).toBe("えきに");
    expect(sanitizeRuby("{駅|えき}に")).toBe("{駅|えき}に");
  });

  it("removes stray braces but keeps valid ruby", () => {
    expect(sanitizeRuby("{駅}に{行|い}く}")).toBe("駅に{行|い}く");
  });
});

describe("answer normalisation", () => {
  it("folds width, whitespace, punctuation and katakana", () => {
    expect(normalizeAnswer(" タベル。")).toBe("たべる");
    expect(normalizeAnswer("ｴｲｶﾞ")).toBe("えいが");
    expect(normalizeAnswer("よ み ま し た")).toBe("よみました");
  });

  it("keeps katakana when the script is being tested", () => {
    expect(normalizeAnswer("コーヒー", { keepScript: true })).toBe("コーヒー");
  });

  it("accepts listed alternatives", () => {
    expect(answersMatch("よみました", "読みました", { alternatives: ["よみました"] })).toBe(true);
    expect(answersMatch("よみます", "読みました", { alternatives: ["よみました"] })).toBe(false);
    expect(answersMatch("", "えき")).toBe(false);
  });
});

import { cleanPointLabel, pointKey } from "@/lib/domain/points";

describe("learning point labels", () => {
  it("keeps hyphens inside words and normalises separating dashes", () => {
    expect(cleanPointLabel("〜ように - so that (non-volitional)")).toBe("〜ように — so that (non-volitional)");
    expect(cleanPointLabel("で–place of action")).toBe("で — place of action");
    expect(pointKey("grammar", "で — Place of action")).toBe(pointKey("grammar", "で - place of action"));
  });
});
