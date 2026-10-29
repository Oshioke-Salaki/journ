import { ArrowRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { getRecentCheckIns } from "@/features/check-in/queries";
import { GoalCard } from "@/features/goals/components/goal-card";
import { listGoals, upcomingSteps } from "@/features/goals/queries";
import { countEntries } from "@/features/journal/queries";
import { DayStrip } from "@/features/reports/day-strip";
import { MoodChart } from "@/features/reports/mood-chart";
import { summarise } from "@/features/reports/summary";
import { getTrackerAverages } from "@/features/trackers/queries";
import { formatTracker, TRACKERS } from "@/features/trackers/constants";
import { listVisionItems } from "@/features/vision/queries";
import { requireMember } from "@/lib/auth/session";
import { addDays, relativeDay } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "My Space" };

const DAYS = 30;

export default function SpacePage() {
  return (
    <PageContainer>
      <PageHeader
        title="My Space"
        description="Your goals, your plans and what your check-ins are telling you."
        actions={
          <Link href={routes.newGoal} className={buttonVariants({ size: "md" })}>
            <Plus aria-hidden />
            Set a goal
          </Link>
        }
      />
      <Suspense fallback={<SpaceSkeleton />}>
        <Space />
      </Suspense>
    </PageContainer>
  );
}

async function Space() {
  const { user, today } = await requireMember();
  const [checkIns, goals, plans, entries, habits, vision] = await Promise.all([
    getRecentCheckIns(today, DAYS),
    listGoals(),
    upcomingSteps(6),
    countEntries(addDays(today, -(DAYS - 1))),
    getTrackerAverages(addDays(today, -(DAYS - 1)), today),
    listVisionItems(),
  ]);
  const report = summarise(checkIns, today, DAYS);
  const active = goals.filter((g) => g.status === "active");
  const stepsDone = goals.flatMap((g) => g.goal_steps).filter((s) => s.done_at && s.done_at.slice(0, 10) >= addDays(today, -(DAYS - 1))).length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <section aria-label="Last 30 days at a glance" className="lg:col-span-12">
        <dl className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-panel)] bg-sand sm:grid-cols-4">
          <Figure label="Days checked in" value={report.daysCheckedIn} suffix={`/ ${DAYS}`} />
          <Figure label="Current streak" value={report.streak} suffix={report.streak === 1 ? "day" : "days"} />
          <Figure label="Journal entries" value={entries} />
          <Figure label="Steps completed" value={stepsDone} />
        </dl>
      </section>

      <section aria-labelledby="report-heading" className="flex flex-col gap-6 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6 lg:col-span-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="report-heading" className="text-[17px] font-semibold text-ink">
            My reports
          </h2>
          <p className="text-[14px] text-muted">Last {DAYS} days</p>
        </div>
        <DayStrip days={report.series.slice(-14)} userId={user.id} today={today} />
        {report.daysCheckedIn ? (
          <div className="rounded-[16px] bg-surface p-3 sm:p-4">
            <MoodChart points={report.series} />
          </div>
        ) : (
          <EmptyState
            title="Your mood chart starts with your first check-in"
            action={
              <Link href={routes.checkIn} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                Check in now
              </Link>
            }
          >
            Each day you check in adds a point here, so you can see how your weeks really go.
          </EmptyState>
        )}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <TopList title="Where you felt it" items={report.areas} empty="Body notes from your check-ins will gather here." />
          <TopList title="Words you used most" items={report.feelings} empty="Feeling words from your check-ins will gather here." />
          <div className="flex flex-col gap-3">
            <h3 className="text-[15px] font-medium text-ink">Daily averages</h3>
            {habits.length ? (
              <dl className="flex flex-col gap-2.5">
                {TRACKERS.filter((t) => habits.some((h) => h.kind === t.kind)).map((t) => {
                  const h = habits.find((x) => x.kind === t.kind)!;
                  return (
                    <div key={t.kind} className="flex justify-between gap-4 text-[14px]">
                      <dt className="text-ink">{t.label}</dt>
                      <dd className="num text-muted">
                        {formatTracker(t.kind, t.scale ? Math.round(h.average) : Math.round(h.average * 10) / 10)}
                        <span className="text-faint"> · {h.days === 1 ? "1 day" : `${h.days} days`}</span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <p className="text-[14px] text-muted">Water, sleep and movement you track on Today will average out here.</p>
            )}
          </div>
        </div>
      </section>



      <section aria-labelledby="goals-heading" className="flex flex-col gap-5 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6 lg:col-span-7">
        <div className="flex items-baseline justify-between">
          <h2 id="goals-heading" className="text-[17px] font-semibold text-ink">
            My goals <span className="num font-normal text-muted">{active.length}</span>
          </h2>
          <Link href={routes.goals} className="text-[14px] font-medium text-accent-ink hover:underline">
            View all
          </Link>
        </div>
        {active.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {active.slice(0, 4).map((g) => (
              <li key={g.id}>
                <GoalCard goal={g} className="bg-surface hover:bg-active" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No goals in progress"
            action={
              <Link href={routes.newGoal} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                Set your first goal
              </Link>
            }
          >
            Pick one thing within your control and break it into small steps.
          </EmptyState>
        )}
      </section>

      <section aria-labelledby="plans-heading" className="flex flex-col gap-5 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6 lg:col-span-5">
        <h2 id="plans-heading" className="text-[17px] font-semibold text-ink">
          My plans
        </h2>
        {plans.length ? (
          <ul className="flex flex-col gap-1.5">
            {plans.map((s) => {
              const overdue = s.due_date! < today;
              return (
                <li key={s.id}>
                  <Link href={routes.goal(s.goal.id)} className="flex items-center justify-between gap-4 rounded-[14px] bg-surface px-4 py-3 hover:bg-active">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-ink">{s.title}</span>
                      <span className="block truncate text-[13px] text-muted">{s.goal.title}</span>
                    </span>
                    <span className={cn("shrink-0 text-[13px]", overdue ? "font-medium text-negative" : "text-muted")}>
                      {overdue ? "Overdue" : relativeDay(s.due_date!, today)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Nothing planned yet">Give a goal&rsquo;s steps a date and they will line up here, soonest first.</EmptyState>
        )}
        <Link href={routes.goals} className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-medium text-accent-ink hover:underline">
          All goals and steps
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <section aria-labelledby="vision-heading" className="flex flex-col gap-5 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6 lg:col-span-12">
        <div className="flex items-baseline justify-between">
          <h2 id="vision-heading" className="text-[17px] font-semibold text-ink">
            My vision board
          </h2>
          <Link href={routes.vision} className="text-[14px] font-medium text-accent-ink hover:underline">
            {vision.length ? "Open board" : "Start your board"}
          </Link>
        </div>
        {vision.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {vision.slice(0, 6).map((v, i) => (
              <li key={v.id} className={cn(i >= 4 && "hidden lg:block")}>
                <Link href={routes.vision} className="block aspect-square overflow-hidden rounded-[16px] bg-sand">
                  {v.kind === "image" && v.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.url} alt={v.caption ?? "A picture on your vision board"} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center p-4 font-serif text-[18px] leading-snug text-ink">{v.words}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-muted">Pictures and words that remind you where you are going. Only you can see them.</p>
        )}
      </section>
    </div>
  );
}

function Figure({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex flex-col gap-1 p-5 sm:p-6">
      <dt className="text-[14px] text-muted">{label}</dt>
      <dd className="num text-[30px] leading-none text-ink">
        {value}
        {suffix ? <span className="ml-1.5 text-[15px] text-muted">{suffix}</span> : null}
      </dd>
    </div>
  );
}

function TopList({ title, items, empty }: { title: string; items: { label: string; n: number }[]; empty: string }) {
  const top = items.slice(0, 4);
  const max = top[0]?.n ?? 1;
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
      {top.length ? (
        <ul className="flex flex-col gap-3">
          {top.map((item, i) => (
            <li key={item.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[14px]">
                <span className="text-ink">{item.label}</span>
                <span className="num text-muted">{item.n === 1 ? "1 day" : `${item.n} days`}</span>
              </div>
              <span className="block h-[3px] rounded-full bg-active">
                <span className={cn("block h-full rounded-full", i === 0 ? "bg-accent" : "bg-control")} style={{ width: `${(item.n / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-muted">{empty}</p>
      )}
    </div>
  );
}

function SpaceSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Skeleton className="h-[104px] rounded-[var(--radius-panel)] lg:col-span-12" />
      <Skeleton className="h-[560px] rounded-[var(--radius-panel)] lg:col-span-12" />
      <Skeleton className="h-[300px] rounded-[var(--radius-panel)] lg:col-span-7" />
      <Skeleton className="h-[300px] rounded-[var(--radius-panel)] lg:col-span-5" />
    </div>
  );
}
