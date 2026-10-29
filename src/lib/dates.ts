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
