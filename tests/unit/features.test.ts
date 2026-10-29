import { describe, expect, it } from "vitest";
import { landscapeGeometry, paletteFor, palettes, seedFrom } from "@/components/brand/landscape-geometry";
import { authErrorMessage } from "@/features/auth/errors";
import type { CheckIn } from "@/features/check-in/queries";
import { summarise } from "@/features/reports/summary";
import { formatTracker } from "@/features/trackers/constants";

describe("landscape", () => {
  it("draws the same picture for the same seed", () => {
    expect(landscapeGeometry(4, 3, 42)).toEqual(landscapeGeometry(4, 3, 42));
    expect(landscapeGeometry(4, 3, 42)).not.toEqual(landscapeGeometry(4, 3, 43));
    expect(seedFrom("abc")).toBe(seedFrom("abc"));
  });

  it("raises the sun with mood and the hills with energy, and stays in frame", () => {
    const low = landscapeGeometry(1, 3, 1);
    const high = landscapeGeometry(5, 3, 1);
    expect(high.sunY).toBeLessThan(low.sunY);
    expect(high.sunY - 8).toBeGreaterThanOrEqual(10);
    expect(landscapeGeometry(9, 3, 1).sunY).toBe(high.sunY);
    expect(paletteFor(1)).toBe(palettes.hush);
    expect(paletteFor(4)).toBe(palettes.dawn);
  });
});

function checkIn(local_date: string, mood: number, extra: Partial<CheckIn> = {}): CheckIn {
  return {
    id: local_date, user_id: "u", local_date, mood, energy: 3, efficiency: null, self_satisfaction: null,
    body: [], feelings: [], note: null, created_at: "", updated_at: "", ...extra,
  };
}

describe("reports", () => {
  it("builds the series with gaps, patterns, average and streak from the rows", () => {
    const rows = [
      checkIn("2026-10-25", 2, { body: [{ area: "shoulders", sensation: "tension" }], feelings: ["tired"] }),
      checkIn("2026-10-27", 4, { body: [{ area: "shoulders", sensation: null }, { area: "jaw", sensation: "tension" }], feelings: ["calm", "tired"] }),
      checkIn("2026-10-28", 4),
      checkIn("2026-10-29", 5),
    ];
    const r = summarise(rows, "2026-10-29", 7);
    expect(r.series.map((s) => s.mood)).toEqual([null, null, 2, null, 4, 4, 5]);
    expect(r.daysCheckedIn).toBe(4);
    expect(r.average).toBe(3.75);
    expect(r.streak).toBe(3);
    expect(r.areas[0]).toEqual({ label: "Shoulders", n: 2 });
    expect(r.feelings[0]).toEqual({ label: "Tired", n: 2 });
  });

  it("keeps a streak alive until the day is over", () => {
    expect(summarise([checkIn("2026-10-28", 3)], "2026-10-29", 7).streak).toBe(1);
    expect(summarise([], "2026-10-29", 7).streak).toBe(0);
  });
});

describe("trackers", () => {
  it("formats each kind with its unit", () => {
    expect(formatTracker("water", 1)).toBe("1 glass");
    expect(formatTracker("water", 6)).toBe("6 glasses");
    expect(formatTracker("sleep", 7.5)).toBe("7.5 hours");
    expect(formatTracker("movement", 30)).toBe("30 min");
    expect(formatTracker("nutrition", 4)).toBe("Well");
  });
});

describe("auth errors", () => {
  it("turns error codes into sentences", () => {
    expect(authErrorMessage({ code: "invalid_credentials", status: 400, message: "" })).toMatch(/don't match/);
    expect(authErrorMessage({ code: undefined, status: 429, message: "" })).toMatch(/Too many attempts/);
    expect(authErrorMessage({ code: "something_new", status: 500, message: "" })).toMatch(/try again/);
  });
});
