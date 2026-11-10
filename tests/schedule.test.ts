import { describe, expect, it } from "vitest";
import { addDays, currentStreak, daysUntil, dayKey, longestStreak } from "@/lib/domain/dates";
import { gradeCard, newCardState } from "@/lib/domain/srs";

describe("streaks", () => {
  it("counts back from today, or from yesterday if today isn't done yet", () => {
    expect(currentStreak(["2026-11-08", "2026-11-09", "2026-11-10"], "2026-11-10")).toBe(3);
    expect(currentStreak(["2026-11-08", "2026-11-09"], "2026-11-10")).toBe(2);
    expect(currentStreak(["2026-11-07"], "2026-11-10")).toBe(0);
  });

  it("finds the longest run", () => {
    expect(longestStreak(["2026-01-01", "2026-01-02", "2026-01-04", "2026-01-05", "2026-01-06"])).toBe(3);
  });

  it("does calendar maths across months", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(daysUntil("2026-12-06", "2026-11-10")).toBe(26);
  });

  it("uses the learner's timezone for the day", () => {
    const t = new Date("2026-11-10T20:00:00Z");
    expect(dayKey(t, "Asia/Tokyo")).toBe("2026-11-11");
    expect(dayKey(t, "America/Los_Angeles")).toBe("2026-11-10");
    expect(dayKey(t, "Not/AZone")).toBe("2026-11-10");
  });
});

describe("spaced repetition", () => {
  it("brings a missed card back soon and a known card back later", () => {
    const now = new Date("2026-11-10T09:00:00Z");
    const card = newCardState(now);
    const again = gradeCard(card, "again", now);
    const good = gradeCard(card, "good", now);
    const easy = gradeCard(card, "easy", now);
    expect(again.due.getTime()).toBeLessThanOrEqual(good.due.getTime());
    expect(good.due.getTime()).toBeLessThan(easy.due.getTime());
    expect(easy.due.getTime() - now.getTime()).toBeGreaterThan(24 * 3600_000);
  });
});
