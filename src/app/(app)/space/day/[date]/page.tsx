import { ArrowLeft, ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { canCheckInFor } from "@/features/check-in/constants";
import { getCheckIn } from "@/features/check-in/queries";
import { ZONES } from "@/features/control/constants";
import { listControlItems } from "@/features/control/queries";
import { listEntriesForDay } from "@/features/journal/queries";
import { CheckInSummary } from "@/features/today/check-in-summary";
import { formatTracker, TRACKERS } from "@/features/trackers/constants";
import { getTrackerTotals } from "@/features/trackers/queries";
import { requireMember } from "@/lib/auth/session";
import { addDays, formatDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Your day" };

export default function DayPage({ params }: PageProps<"/space/day/[date]">) {
  return (
    <PageContainer>
      <Link href={routes.space} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-4 mb-6")}>
        <ArrowLeft aria-hidden />
        My Space
      </Link>
      <Suspense fallback={<DaySkeleton />}>
        <Day params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function Day({ params }: Pick<PageProps<"/space/day/[date]">, "params">) {
  const [{ date }, { user, profile, today }] = await Promise.all([params, requireMember()]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today || Number.isNaN(Date.parse(date))) notFound();

  const [checkIn, entries, trackers, thoughts] = await Promise.all([getCheckIn(date), listEntriesForDay(date), getTrackerTotals(date), listControlItems(date)]);
  const tracked = TRACKERS.filter((t) => (trackers[t.kind] ?? 0) > 0);
  const previous = addDays(date, -1);
  const canCheckIn = canCheckInFor(date, today);
  const checkInHref = date === today ? routes.checkIn : routes.checkInFor(date);
  const next = addDays(date, 1);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[14px] text-muted">{date === today ? "Today" : date === addDays(today, -1) ? "Yesterday" : "Looking back"}</p>
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink sm:text-[32px]">
            {formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h1>
        </div>
        <nav aria-label="Other days" className="flex gap-2">
          <Link href={routes.day(previous)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <ChevronLeft aria-hidden />
            Previous day
          </Link>
          {next <= today ? (
            <Link href={routes.day(next)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Next day
              <ChevronRight aria-hidden />
            </Link>
          ) : null}
        </nav>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        <section aria-label="Check-in" className="rounded-[var(--radius-panel)] bg-raised p-4 sm:p-6 lg:col-span-7 lg:self-start">
          {checkIn ? (
            <CheckInSummary checkIn={checkIn} userId={user.id} timeZone={profile.timezone} editable={canCheckIn} editHref={checkInHref} />
          ) : (
            <EmptyState
              title="No check-in this day"
              action={
                canCheckIn ? (
                  <Link href={checkInHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    {date === today ? "Check in now" : "Add a check-in"}
                  </Link>
                ) : undefined
              }
            >
              {date === today
                ? "How are you feeling right now?"
                : canCheckIn
                  ? "Missed it? You can still add how this day went."
                  : "Days without a check-in keep their place in your reports."}
            </EmptyState>
          )}
        </section>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <section aria-labelledby="day-journal" className="flex flex-col gap-4 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6">
            <h2 id="day-journal" className="text-[17px] font-semibold text-ink">
              Journal <span className="num font-normal text-muted">{entries.length}</span>
            </h2>
            {entries.length ? (
              <ul className="flex flex-col gap-2">
                {entries.map((e) => (
                  <li key={e.id}>
                    <Link href={routes.journalEntry(e.id)} className="flex flex-col gap-1 rounded-[14px] bg-surface px-4 py-3 hover:bg-active">
                      <span className="line-clamp-1 text-[15px] font-medium text-ink">{e.title ?? e.prompt_body ?? e.body.split("\n")[0]}</span>
                      <span className="line-clamp-2 font-serif text-[15px] text-muted">{e.body}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-muted">Nothing written this day.</p>
            )}
            {date === today ? (
              <Link href={routes.newJournalEntry} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "self-start")}>
                <PenLine aria-hidden />
                Write
              </Link>
            ) : null}
          </section>

          <section aria-labelledby="day-tracked" className="flex flex-col gap-3 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6">
            <h2 id="day-tracked" className="text-[17px] font-semibold text-ink">
              Tracked
            </h2>
            {tracked.length ? (
              <dl className="flex flex-col gap-2">
                {tracked.map((t) => (
                  <div key={t.kind} className="flex justify-between text-[15px]">
                    <dt className="text-ink">{t.label}</dt>
                    <dd className="num text-muted">{formatTracker(t.kind, trackers[t.kind]!)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-[15px] text-muted">Nothing tracked this day.</p>
            )}
          </section>

          {thoughts.length ? (
            <section aria-labelledby="day-control" className="flex flex-col gap-3 rounded-[var(--radius-panel)] bg-sand p-5 sm:p-6">
              <h2 id="day-control" className="text-[17px] font-semibold text-ink">
                What was on your mind
              </h2>
              <ul className="flex flex-col gap-1.5">
                {thoughts.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 rounded-[14px] bg-surface px-4 py-2.5 text-[15px]">
                    <span className="min-w-0 truncate text-ink">{t.body}</span>
                    <span className="shrink-0 text-[13px] text-muted">{t.zone ? ZONES.find((z) => z.value === t.zone)?.short : "Not sorted"}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DaySkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-10 w-2/3 max-w-[420px]" />
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-[480px] rounded-[var(--radius-panel)] lg:col-span-7" />
        <Skeleton className="h-[480px] rounded-[var(--radius-panel)] lg:col-span-5" />
      </div>
    </div>
  );
}
