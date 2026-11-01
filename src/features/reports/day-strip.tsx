import Link from "next/link";
import { Landscape, seedFrom } from "@/components/brand/landscape";
import { routes } from "@/lib/routes";
import { moodLabel } from "@/features/check-in/constants";
import { formatDate } from "@/lib/dates";

type Day = { date: string; mood: number | null; energy: number | null };

/** The last days as a row of landscapes. A day without a check-in keeps its place, empty. */
export function DayStrip({ days, userId, today }: { days: Day[]; userId: string; today: string }) {
  return (
    <ol className="grid grid-cols-7 gap-1.5 sm:gap-2 lg:grid-cols-14">
      {days.map((d, i) => (
        // Phones and tablets show the last 7 days; large screens the last 14.
        <li key={d.date} className={`flex-col items-center gap-1.5 ${i < days.length - 7 ? "hidden lg:flex" : "flex"}`}>
          {d.mood !== null ? (
            <Link href={routes.day(d.date)} className="block w-full rounded-[8px] transition-transform hover:scale-[1.04] active:scale-95" aria-label={`Open ${formatDate(d.date, { weekday: "long", day: "numeric", month: "long" })}`}>
            <Landscape
              mood={d.mood}
              energy={d.energy ?? 3}
              seed={seedFrom(`${userId}:${d.date}`)}
              radius={8}
              className="aspect-square"
              title={`${formatDate(d.date, { weekday: "long", day: "numeric", month: "long" })}: ${moodLabel(d.mood).toLowerCase()}`}
            />
            </Link>
          ) : (
            <Link
              href={routes.day(d.date)}
              className="block aspect-square w-full rounded-[8px] border border-dashed border-control transition-colors hover:bg-raised"
              aria-label={`Open ${formatDate(d.date, { weekday: "long", day: "numeric", month: "long" })}: no check-in`}
            />
          )}
          <span className={d.date === today ? "text-[12px] font-semibold text-ink" : "text-[12px] text-muted"}>
            {d.date === today ? "Today" : formatDate(d.date, { weekday: "narrow" })}
          </span>
        </li>
      ))}
    </ol>
  );
}
