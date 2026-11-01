import { describe, expect, it } from "vitest";
import { canCheckInFor } from "@/features/check-in/constants";
import { normaliseTag, entrySchema } from "@/features/journal/schemas";
import { findInsights, type InsightDay } from "@/features/reports/insights";
import { suggestionsFor, type SuggestionVideo } from "@/features/today/suggestions";
import { addDays, monthGrid, monthsBefore, sameWallClock, shiftMonth, timeZoneLabel } from "@/lib/dates";

const VIDEOS: SuggestionVideo[] = [
  { id: "b1", title: "Four-count breathing", topic_slug: "breathing", tier: "free" },
  { id: "m1", title: "Morning mobility", topic_slug: "movement", tier: "free" },
  { id: "m2", title: "Gentle strength for low-energy days", topic_slug: "movement", tier: "premium" },
];

describe("suggestions after a check-in", () => {
  it("offers breathing for tension, naming where it was felt", () => {
    const s = suggestionsFor({ mood: 3, energy: 3, body: [{ area: "shoulders", sensation: "tension" }], feelings: [] }, VIDEOS, false);
    expect(s[0]).toMatchObject({ key: "breathe", reason: "For the tension in your shoulders", href: "/discover/b1" });
  });

  it("offers the circle of control when overwhelmed, and at most three things", () => {
    const s = suggestionsFor({ mood: 1, energy: 1, body: [], feelings: ["overwhelmed", "sad"] }, VIDEOS, false);
    expect(s.map((x) => x.key)).toEqual(["breathe", "control", "move"]);
  });

  it("only suggests premium videos to premium members", () => {
    expect(suggestionsFor({ mood: 3, energy: 1, body: [], feelings: [] }, VIDEOS, false).find((x) => x.key === "move")?.href).toBe("/discover/m1");
    expect(suggestionsFor({ mood: 3, energy: 1, body: [], feelings: [] }, VIDEOS, true).find((x) => x.key === "move")?.href).toBe("/discover/m2");
  });

  it("matches the writing prompt to the mood", () => {
    const write = (mood: number) => suggestionsFor({ mood, energy: null, body: [], feelings: [] }, [], false).find((x) => x.key === "write")!.href;
    expect(write(1)).toContain("hard-day");
    expect(write(3)).toContain("check-in");
    expect(write(5)).toContain("good-day");
  });
});

describe("insights", () => {
  const day = (i: number, extra: Partial<InsightDay>): InsightDay => ({ date: addDays("2026-08-01", i), mood: 3, energy: 3, feelings: [], body: [], ...extra });

  it("says nothing without enough days on both sides", () => {
    expect(findInsights([day(0, { sleep: 8, mood: 5 }), day(1, { sleep: 5, mood: 1 })])).toEqual([]);
  });

  it("compares mood after long and short nights", () => {
    const days = [...Array.from({ length: 5 }, (_, i) => day(i, { sleep: 8, mood: 4 })), ...Array.from({ length: 5 }, (_, i) => day(i + 5, { sleep: 5, mood: 2 }))];
    expect(findInsights(days).find((i) => i.key === "sleep")?.text).toBe("After 7 or more hours of sleep, your mood averages good, against low on shorter nights.");
  });

  it("finds the hardest weekday", () => {
    // 2026-08-03 is a Monday. Mondays low, everything else okay or better.
    const days = Array.from({ length: 21 }, (_, i) => day(i + 2, { mood: (i + 2) % 7 === 2 ? 1 : 4 }));
    expect(findInsights(days).find((i) => i.key === "weekday")?.text).toMatch(/^Mondays tend to be your hardest days/);
  });

  it("names what comes with low days", () => {
    const days = [day(0, { mood: 1, feelings: ["tired"] }), day(1, { mood: 2, feelings: ["tired", "sad"] }), day(2, { mood: 1, feelings: ["anxious"] })];
    expect(findInsights(days).find((i) => i.key === "low-feeling")?.text).toBe("On your low days you most often felt tired (2 of 3 days).");
  });
});

describe("dates", () => {
  it("goes back months, clamping to the month's end", () => {
    expect(monthsBefore("2026-03-31", 1)).toBe("2026-02-28");
    expect(monthsBefore("2026-11-01", 12)).toBe("2025-11-01");
    expect(monthsBefore("2026-01-15", 1)).toBe("2025-12-15");
  });

  it("lays a month out Monday to Sunday", () => {
    const { first, last, weeks } = monthGrid("2026-11");
    expect([first, last]).toEqual(["2026-11-01", "2026-11-30"]);
    expect(weeks[0].slice(0, 7)).toEqual([null, null, null, null, null, null, "2026-11-01"]); // 1 Nov 2026 is a Sunday
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("allows check-ins for the last seven days only", () => {
    expect(canCheckInFor("2026-11-01", "2026-11-01")).toBe(true);
    expect(canCheckInFor("2026-10-25", "2026-11-01")).toBe(true);
    expect(canCheckInFor("2026-10-24", "2026-11-01")).toBe(false);
    expect(canCheckInFor("2026-11-02", "2026-11-01")).toBe(false);
    expect(canCheckInFor("nonsense", "2026-11-01")).toBe(false);
  });

  it("knows when two zones show the same time", () => {
    const now = new Date("2026-11-01T09:00:00Z");
    expect(sameWallClock("Africa/Nairobi", "Africa/Addis_Ababa", now)).toBe(true);
    expect(sameWallClock("Africa/Nairobi", "Europe/London", now)).toBe(false);
    expect(timeZoneLabel("America/New_York")).toBe("New York (America)");
    expect(timeZoneLabel("UTC")).toBe("UTC");
  });
});

describe("journal tags", () => {
  it("normalises what is typed", () => {
    expect(normaliseTag("  Self   Care! ")).toBe("self care");
    expect(normaliseTag("--work")).toBe("work");
    expect(normaliseTag("!!!")).toBe("");
  });

  it("dedupes, caps at ten, and defaults to none", () => {
    const base = { title: null, doc: {}, promptId: null };
    expect(entrySchema.parse({ ...base, tags: ["Work", "work", "family"] }).tags).toEqual(["work", "family"]);
    expect(entrySchema.parse(base).tags).toEqual([]);
    expect(entrySchema.safeParse({ ...base, tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).success).toBe(false);
    expect(entrySchema.safeParse({ ...base, tags: ["!!!"] }).success).toBe(false);
  });
});
