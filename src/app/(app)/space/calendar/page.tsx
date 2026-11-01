import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Landscape, seedFrom } from "@/components/brand/landscape";
import { PageContainer } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { moodLabel } from "@/features/check-in/constants";
import { getCheckInsBetween } from "@/features/check-in/queries";
import { countEntriesByDay } from "@/features/journal/queries";
import { requireMember } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { formatDate, monthGrid, shiftMonth } from "@/lib/dates";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Calendar" };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage({ searchParams }: PageProps<"/space/calendar">) {
  return (
    <PageContainer>
      <Link href={routes.space} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-4 mb-6")}>
        <ArrowLeft aria-hidden />
        My Space
      </Link>
      <Suspense fallback={<CalendarSkeleton />}>
        <Calendar searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Calendar({ searchParams }: Pick<PageProps<"/space/calendar">, "searchParams">) {
  const [{ user, today }, params] = await Promise.all([requireMember(), searchParams]);
  const thisMonth = today.slice(0, 7);
  const asked = typeof params.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month) ? params.month : thisMonth;
  const month = asked > thisMonth ? thisMonth : asked;
  const { first, last, weeks } = monthGrid(month);
  const [checkIns, entries] = await Promise.all([getCheckInsBetween(first, last), countEntriesByDay(first, last)]);
  const byDate = new Map(checkIns.map((c) => [c.local_date, c]));
  const moods = checkIns.map((c) => c.mood);
  const average = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
  const written = [...entries.values()].reduce((a, b) => a + b, 0);
  const title = formatDate(first, { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[14px] text-muted">Calendar</p>
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink sm:text-[32px]">{title}</h1>
        </div>
        <nav aria-label="Other months" className="flex gap-2">
          <Link href={routes.calendar(shiftMonth(month, -1))} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <ChevronLeft aria-hidden />
            {formatDate(`${shiftMonth(month, -1)}-01`, { month: "short" })}
          </Link>
          {month < thisMonth ? (
            <Link href={routes.calendar(shiftMonth(month, 1))} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              {formatDate(`${shiftMonth(month, 1)}-01`, { month: "short" })}
              <ChevronRight aria-hidden />
            </Link>
          ) : null}
        </nav>
      </header>

      <dl className="grid grid-cols-3 overflow-hidden rounded-[var(--radius-panel)] bg-sand">
        <Figure label="Days checked in" value={String(checkIns.length)} />
        <Figure label="Usual mood" value={average === null ? "–" : moodLabel(Math.round(average))} />
        <Figure label="Journal entries" value={String(written)} />
      </dl>

      <section aria-label={`${title}, day by day`} className="rounded-[var(--radius-panel)] bg-raised p-3 sm:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2" aria-hidden>
          {WEEKDAYS.map((d) => (
            <span key={d} className="pb-1 text-center text-[12px] text-muted sm:text-[13px]">
              {d}
            </span>
          ))}
        </div>
        <ol className="grid grid-cols-7 gap-1 sm:gap-2">
          {weeks.flat().map((date, i) => {
            if (!date) return <li key={`blank-${i}`} aria-hidden />;
            const c = byDate.get(date);
            const n = entries.get(date) ?? 0;
            const future = date > today;
            const label = `${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}${c ? `: ${moodLabel(c.mood).toLowerCase()}` : ": no check-in"}${n ? `, ${n === 1 ? "1 entry" : `${n} entries`}` : ""}`;
            const inner = (
              <>
                {c ? <Landscape mood={c.mood} energy={c.energy ?? 3} seed={seedFrom(`${user.id}:${date}`)} radius={8} className="absolute inset-0" /> : null}
                <span
                  className={cn(
                    "relative m-1 grid size-6 place-items-center rounded-full text-[12px] sm:size-7 sm:text-[13px]",
                    c ? "bg-surface/85 text-ink" : "text-muted",
                    date === today && "bg-primary font-semibold text-on-primary",
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                {n ? <span className="absolute right-1.5 bottom-1.5 size-1.5 rounded-full bg-accent-ink ring-2 ring-surface" /> : null}
              </>
            );
            return (
              <li key={date}>
                {future ? (
                  <span className="relative block aspect-square overflow-hidden rounded-[10px] opacity-40" aria-hidden>
                    {inner}
                  </span>
                ) : (
                  <Link
                    href={routes.day(date)}
                    aria-label={label}
                    className={cn(
                      "relative block aspect-square overflow-hidden rounded-[10px] transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-95",
                      !c && "border border-dashed border-control hover:bg-active",
                    )}
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
          <span className="size-1.5 shrink-0 rounded-full bg-accent-ink" aria-hidden />A dot means you wrote that day. Open any day to see everything from it.
        </p>
      </section>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 sm:p-5">
      <dt className="text-[13px] text-muted sm:text-[14px]">{label}</dt>
      <dd className="num text-[20px] font-semibold text-ink sm:text-[24px]">{value}</dd>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-2/3 max-w-[320px]" />
      <Skeleton className="h-[88px] rounded-[var(--radius-panel)]" />
      <Skeleton className="aspect-[7/6] max-h-[720px] rounded-[var(--radius-panel)]" />
    </div>
  );
}
