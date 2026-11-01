import { areaLabel, moodLabel } from "@/features/check-in/constants";
import { fromIsoDate } from "@/lib/dates";

/**
 * Patterns in her own check-ins and tracking, said in plain words. No AI: each insight is a simple
 * comparison, and only appears when both sides have enough days behind them to mean something.
 */

export type InsightDay = {
  date: string;
  mood: number;
  energy: number | null;
  feelings: string[];
  body: { area: string; sensation: string | null }[];
  sleep?: number;
  movement?: number;
  water?: number;
};

export type Insight = { key: string; text: string };

/** Fewest days on each side of a comparison before it is shown. */
export const MIN_DAYS = 4;

const WEEKDAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const word = (n: number) => moodLabel(Math.round(n)).toLowerCase();

function compare(days: InsightDay[], split: (d: InsightDay) => boolean | null, measure: (d: InsightDay) => number | null) {
  const yes: number[] = [];
  const no: number[] = [];
  for (const d of days) {
    const side = split(d);
    const value = measure(d);
    if (side === null || value === null) continue;
    (side ? yes : no).push(value);
  }
  if (yes.length < MIN_DAYS || no.length < MIN_DAYS) return null;
  return { yes: mean(yes), no: mean(no), diff: mean(yes) - mean(no) };
}

export function findInsights(days: InsightDay[]): Insight[] {
  const out: Insight[] = [];

  const sleep = compare(days, (d) => (d.sleep === undefined ? null : d.sleep >= 7), (d) => d.mood);
  if (sleep && Math.abs(sleep.diff) >= 0.5) {
    out.push({
      key: "sleep",
      text:
        sleep.diff > 0
          ? `After 7 or more hours of sleep, your mood averages ${word(sleep.yes)}, against ${word(sleep.no)} on shorter nights.`
          : `Interestingly, your mood is lower after longer nights (${word(sleep.yes)}) than shorter ones (${word(sleep.no)}).`,
    });
  }

  const moved = compare(days, (d) => (d.movement === undefined ? null : d.movement >= 20), (d) => d.energy);
  if (moved && moved.diff >= 0.5) {
    out.push({ key: "movement", text: `On days you move for 20 minutes or more, your energy is higher: ${moved.yes.toFixed(1)} out of 5, against ${moved.no.toFixed(1)}.` });
  }

  const water = compare(days, (d) => (d.water === undefined ? null : d.water >= 6), (d) => d.energy);
  if (water && water.diff >= 0.5) {
    out.push({ key: "water", text: `Your energy is higher on days you drink 6 or more glasses of water (${water.yes.toFixed(1)} against ${water.no.toFixed(1)}).` });
  }

  // Weekdays: only with two or more check-ins on every weekday compared.
  const byWeekday = new Map<number, number[]>();
  for (const d of days) {
    const w = fromIsoDate(d.date).getUTCDay();
    byWeekday.set(w, [...(byWeekday.get(w) ?? []), d.mood]);
  }
  const weekdays = [...byWeekday].filter(([, moods]) => moods.length >= 2).map(([w, moods]) => ({ w, avg: mean(moods) }));
  if (weekdays.length >= 5 && days.length >= 14) {
    weekdays.sort((a, b) => a.avg - b.avg);
    const low = weekdays[0];
    const high = weekdays[weekdays.length - 1];
    if (high.avg - low.avg >= 0.7) {
      out.push({ key: "weekday", text: `${WEEKDAYS[low.w]} tend to be your hardest days, and ${WEEKDAYS[high.w].toLowerCase()} your best.` });
    }
  }

  // What comes with low days.
  const low = days.filter((d) => d.mood <= 2);
  if (low.length >= 3) {
    const counts = new Map<string, number>();
    for (const d of low) for (const f of new Set(d.feelings)) counts.set(f, (counts.get(f) ?? 0) + 1);
    const top = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (top && top[1] >= Math.ceil(low.length / 2)) {
      out.push({ key: "low-feeling", text: `On your low days you most often felt ${top[0]} (${top[1]} of ${low.length} days).` });
    }
    const areas = new Map<string, number>();
    for (const d of low) for (const a of new Set(d.body.map((b) => b.area))) areas.set(a, (areas.get(a) ?? 0) + 1);
    const area = [...areas].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (area && area[1] >= Math.ceil(low.length / 2)) {
      out.push({ key: "low-body", text: `Low days often show up in your ${areaLabel(area[0]).toLowerCase()} (${area[1]} of ${low.length} days).` });
    }
  }

  return out;
}
