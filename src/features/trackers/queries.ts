import "server-only";
import { createClient } from "@/lib/supabase/server";
import { tracker, type TrackerKind } from "./constants";

export type TrackerTotals = Partial<Record<TrackerKind, number>>;

/** Today's value per tracker: the sum for "add" trackers, the latest for "set" trackers. */
export async function getTrackerTotals(day: string): Promise<TrackerTotals> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tracker_entries")
    .select("kind, value, created_at")
    .eq("local_date", day)
    .order("created_at");
  if (error) throw new Error(`Could not load tracking: ${error.message}`);
  const totals: TrackerTotals = {};
  for (const row of data) {
    const value = Number(row.value);
    totals[row.kind] = tracker(row.kind).mode === "add" ? (totals[row.kind] ?? 0) + value : value;
  }
  return totals;
}

/** Daily averages over the days that have a value, for reports. */
export async function getTrackerAverages(from: string, to: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tracker_entries")
    .select("kind, value, local_date, created_at")
    .gte("local_date", from)
    .lte("local_date", to)
    .order("created_at");
  if (error) throw new Error(`Could not load tracking: ${error.message}`);
  const perDay = new Map<string, number>();
  for (const row of data) {
    const key = `${row.kind}|${row.local_date}`;
    const value = Number(row.value);
    perDay.set(key, tracker(row.kind).mode === "add" ? (perDay.get(key) ?? 0) + value : value);
  }
  const sums = new Map<TrackerKind, { total: number; days: number }>();
  for (const [key, value] of perDay) {
    const kind = key.split("|")[0] as TrackerKind;
    const s = sums.get(kind) ?? { total: 0, days: 0 };
    sums.set(kind, { total: s.total + value, days: s.days + 1 });
  }
  return [...sums].map(([kind, s]) => ({ kind, average: s.total / s.days, days: s.days }));
}
