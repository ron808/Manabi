import { beforeEach, describe, expect, it } from "vitest";
import { checkerFor, coolDown, cooldownFor, nextModels, reasoningOptions, resetRotation } from "@/lib/ai/models";

const POOL = ["a", "b", "c"];

beforeEach(() => resetRotation());

describe("model rotation", () => {
  it("starts each call on the next model in turn", () => {
    expect(nextModels(POOL)[0]).toBe("a");
    expect(nextModels(POOL)[0]).toBe("b");
    expect(nextModels(POOL)[0]).toBe("c");
    expect(nextModels(POOL)[0]).toBe("a");
  });

  it("always offers every model, in rotated order", () => {
    nextModels(POOL);
    expect(nextModels(POOL)).toEqual(["b", "c", "a"]);
  });

  it("moves a rate-limited model to the back until its cooldown ends", () => {
    const now = 1_000_000;
    coolDown("a", 60_000, now);
    expect(nextModels(POOL, now)).toEqual(["b", "c", "a"]);
    expect(nextModels(POOL, now + 61_000)).toEqual(["b", "c", "a"]);
    expect(nextModels(POOL, now + 61_000)).toEqual(["c", "a", "b"]);
  });

  it("picks a checker that isn't the writer, skipping cooling models", () => {
    const now = 5_000;
    expect(checkerFor("a", POOL, now)).toBe("b");
    coolDown("b", 10_000, now);
    expect(checkerFor("a", POOL, now)).toBe("c");
  });
});

describe("cooldowns", () => {
  it("honours retry-after on rate limits", () => {
    expect(cooldownFor({ status: 429, headers: new Headers({ "retry-after": "12" }) })).toBe(12_000);
    expect(cooldownFor({ status: 429, headers: new Headers() })).toBe(60_000);
  });

  it("benches retired models for an hour", () => {
    expect(cooldownFor({ status: 404 })).toBe(3_600_000);
    expect(cooldownFor({ status: 400, error: { code: "model_decommissioned" } })).toBe(3_600_000);
  });

  it("doesn't bench a model for a bad answer", () => {
    expect(cooldownFor(new Error("no valid questions in response"))).toBe(0);
    expect(cooldownFor(new SyntaxError("Unexpected token"))).toBe(0);
    expect(cooldownFor({ status: 503 })).toBe(15_000);
  });
});

describe("reasoning options", () => {
  it("hides Qwen's inline reasoning and leaves GPT-OSS alone", () => {
    expect(reasoningOptions("qwen/qwen3.8-27b", "low")).toEqual({ reasoning_effort: "low", reasoning_format: "hidden" });
    expect(reasoningOptions("openai/gpt-oss-120b", "medium")).toEqual({ reasoning_effort: "medium" });
  });
});
