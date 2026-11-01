/**
 * Calendar helpers. A member's "today" is their own calendar day, in the timezone saved on their
 * profile, never the server's. Dates travel as ISO strings (YYYY-MM-DD) so they never shift.
 */

export type IsoDate = string;

const isoFormatterCache = new Map<string, Intl.DateTimeFormat>();

function isoFormatter(timeZone: string) {
  let formatter = isoFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    isoFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date at `now` in `timeZone`, as YYYY-MM-DD. Falls back to UTC for a bad zone. */
export function localDate(timeZone: string, now: Date = new Date()): IsoDate {
  return isoFormatter(isValidTimeZone(timeZone) ? timeZone : "UTC").format(now);
}

/** The hour (0-23) at `now` in `timeZone`. */
export function localHour(timeZone: string, now: Date = new Date()) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: isValidTimeZone(timeZone) ? timeZone : "UTC",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return Number(hour);
}

export type PartOfDay = "morning" | "afternoon" | "evening" | "night";

export function partOfDay(hour: number): PartOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/** A date-only value as a Date at noon UTC, so formatting never moves it to a neighbouring day. */
export function fromIsoDate(date: IsoDate) {
  return new Date(`${date}T12:00:00Z`);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = fromIsoDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive list of dates from `start` to `end`. */
export function dateRange(start: IsoDate, end: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function formatDate(date: IsoDate, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options }).format(fromIsoDate(date));
}

/** "Today", "Yesterday", the weekday within a week, then the date. */
export function relativeDay(date: IsoDate, today: IsoDate) {
  if (date === today) return "Today";
  if (date === addDays(today, -1)) return "Yesterday";
  if (date > addDays(today, -7) && date < today) return formatDate(date, { weekday: "long" });
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return formatDate(date, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}

/** The device's time zone, or null when the browser does not say. Client only. */
export function deviceTimeZone(): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && isValidTimeZone(zone) ? zone : null;
  } catch {
    return null;
  }
}

/** Whether two zones show the same wall-clock time at `now` (e.g. Nairobi and Addis Ababa). */
export function sameWallClock(a: string, b: string, now: Date = new Date()) {
  const fmt = (zone: string) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  return isValidTimeZone(a) && isValidTimeZone(b) && fmt(a) === fmt(b);
}

/** "Africa/Nairobi" as "Nairobi (Africa)"; "UTC" stays. */
export function timeZoneLabel(zone: string) {
  const parts = zone.split("/");
  if (parts.length < 2) return zone;
  return `${parts.slice(1).join(" / ").replace(/_/g, " ")} (${parts[0].replace(/_/g, " ")})`;
}

/** The calendar of a month (YYYY-MM): its first and last date, and the weeks Monday to Sunday. */
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const start = fromIsoDate(first);
  const last = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const lead = (start.getUTCDay() + 6) % 7; // Monday first
  const cells: (IsoDate | null)[] = [...Array<null>(lead).fill(null), ...dateRange(first, last)];
  while (cells.length % 7) cells.push(null);
  const weeks: (IsoDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return { first, last, weeks };
}

/** The month before or after `month` (YYYY-MM). */
export function shiftMonth(month: string, by: number) {
  const d = fromIsoDate(`${month}-01`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
}

/** The same day of the month `n` months earlier, clamped to the month's last day (31 Mar → 28 Feb). */
export function monthsBefore(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 - n, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}
