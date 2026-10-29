import { areaLabel, capitalise } from "@/features/check-in/constants";
import type { CheckIn } from "@/features/check-in/queries";
import { addDays, dateRange } from "@/lib/dates";

/** Everything My Reports shows, computed from the rows so every figure agrees with the others. */
export function summarise(checkIns: CheckIn[], today: string, days: number) {
  const byDate = new Map(checkIns.map((c) => [c.local_date, c]));
  const range = dateRange(addDays(today, -(days - 1)), today);
  const series = range.map((date) => ({
    date,
    mood: byDate.get(date)?.mood ?? null,
    energy: byDate.get(date)?.energy ?? null,
  }));

  const count = (values: string[]) => {
    const m = new Map<string, number>();
    for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };

  const areas = count(checkIns.flatMap((c) => c.body.map((b) => b.area))).map(([id, n]) => ({ label: areaLabel(id), n }));
  const feelings = count(checkIns.flatMap((c) => c.feelings)).map(([id, n]) => ({ label: capitalise(id), n }));
  const moods = checkIns.map((c) => c.mood);
  const average = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;

  // Consecutive days with a check-in, counting back from today (or yesterday, if today is still open).
  let streak = 0;
  for (let d = byDate.has(today) ? today : addDays(today, -1); byDate.has(d); d = addDays(d, -1)) streak++;

  return { series, areas, feelings, daysCheckedIn: checkIns.length, average, streak };
}
