import { describe, expect, it } from "vitest";
import { addDays, dateRange, formatDate, localDate, localHour, partOfDay, relativeDay } from "@/lib/dates";

describe("dates", () => {
  const instant = new Date("2026-10-29T22:30:00Z");

  it("uses the member's own timezone for today", () => {
    expect(localDate("UTC", instant)).toBe("2026-10-29");
    expect(localDate("Africa/Nairobi", instant)).toBe("2026-10-30"); // UTC+3, already tomorrow
    expect(localDate("America/Los_Angeles", instant)).toBe("2026-10-29");
  });

  it("falls back to UTC for an unknown timezone", () => {
    expect(localDate("Not/AZone", instant)).toBe("2026-10-29");
  });

  it("knows the hour and the part of the day", () => {
    expect(localHour("Africa/Nairobi", instant)).toBe(1);
    expect(partOfDay(6)).toBe("morning");
    expect(partOfDay(13)).toBe("afternoon");
    expect(partOfDay(19)).toBe("evening");
    expect(partOfDay(23)).toBe("night");
  });

  it("does calendar arithmetic across months and years", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(dateRange("2026-02-27", "2026-03-02")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
  });

  it("never shifts a date when formatting", () => {
    expect(formatDate("2026-10-29", { day: "numeric", month: "long" })).toBe("29 October");
  });

  it("describes recent days in words", () => {
    expect(relativeDay("2026-10-29", "2026-10-29")).toBe("Today");
    expect(relativeDay("2026-10-28", "2026-10-29")).toBe("Yesterday");
    expect(relativeDay("2026-10-26", "2026-10-29")).toBe("Monday");
    expect(relativeDay("2026-09-01", "2026-10-29")).toBe("1 Sept");
    expect(relativeDay("2025-09-01", "2026-10-29")).toBe("1 Sept 2025");
  });
});
