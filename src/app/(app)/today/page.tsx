import { ArrowRight, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { seedFrom } from "@/components/brand/landscape";
import { PageContainer } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { moodLabel } from "@/features/check-in/constants";
import { getCheckIn } from "@/features/check-in/queries";
import { getPromptForDay, getQuoteForDay, getVideos } from "@/features/content/queries";
import { ZONES } from "@/features/control/constants";
import { listControlItems } from "@/features/control/queries";
import { StepList } from "@/features/goals/components/step-list";
import { nextSteps } from "@/features/goals/queries";
import { countEntries } from "@/features/journal/queries";
import { CheckInSummary } from "@/features/today/check-in-summary";
import { FirstWeek } from "@/features/today/first-week";
import { InstallCard } from "@/features/today/install-card";
import { getMemories, getSetupProgress } from "@/features/today/queries";
import { QuickMood } from "@/features/today/quick-mood";
import { suggestionsFor } from "@/features/today/suggestions";
import { TimezoneNudge } from "@/features/today/timezone-nudge";
import { getTrackerTotals } from "@/features/trackers/queries";
import { TrackerPanel } from "@/features/trackers/tracker-panel";
import { firstName, requireMember } from "@/lib/auth/session";
import { addDays, formatDate, localHour, partOfDay, relativeDay } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Today" };

const GREETING = { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Hello" } as const;

export default function TodayPage() {
  return (
    <PageContainer>
      <Suspense fallback={<TodaySkeleton />}>
        <Today />
      </Suspense>
    </PageContainer>
  );
}

async function Today() {
  const { user, profile, today } = await requireMember();
  // The first-week checklist shows for a month after onboarding, until done or hidden.
  const showSetup = !profile.checklist_dismissed_at && Boolean(profile.onboarded_at) && profile.onboarded_at!.slice(0, 10) > addDays(today, -30);
  const [checkIn, quote, prompt, steps, entriesToday, trackers, thoughts, setup, memories, videos, yesterday] = await Promise.all([
    getCheckIn(today),
    getQuoteForDay(today),
    getPromptForDay(today),
    profile.goal_prompts_enabled ? nextSteps(3) : Promise.resolve(null),
    countEntries(today),
    getTrackerTotals(today),
    listControlItems(today),
    showSetup ? getSetupProgress() : Promise.resolve(null),
    getMemories(today),
    getVideos(),
    getCheckIn(addDays(today, -1)),
  ]);
  const setupLeft = setup ? Object.values(setup).some((done) => !done) : false;
  const suggestions = checkIn ? suggestionsFor(checkIn, videos, profile.plan === "premium") : [];
  const sorted = thoughts.filter((t) => t.zone).length;

  const name = firstName(profile);
  const greeting = GREETING[partOfDay(localHour(profile.timezone))];
  const finding = checkIn
    ? `You checked in feeling ${moodLabel(checkIn.mood).toLowerCase()}${entriesToday ? ` and wrote ${entriesToday === 1 ? "once" : `${entriesToday} times`}` : ""}.`
    : "You haven't checked in yet today.";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-4">
      <header className="mb-4 lg:col-span-12 lg:mb-8">
        <h1 className="font-serif text-[34px] leading-[1.08] tracking-[-0.015em] text-ink sm:text-[44px]">
          {greeting}
          {name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-3 text-[16px] text-muted sm:text-[17px]">
          {formatDate(today, { weekday: "long", day: "numeric", month: "long" })}. {finding}
        </p>
      </header>

      <TimezoneNudge saved={profile.timezone} />
      <InstallCard />
      {setup && setupLeft ? <FirstWeek progress={setup} /> : null}

      <div className="flex flex-col gap-4 lg:col-span-8 lg:self-start">
        <section aria-label="Today's check-in" className="rounded-[var(--radius-panel)] bg-raised p-4 sm:p-6">
          {checkIn ? (
            <CheckInSummary checkIn={checkIn} userId={user.id} timeZone={profile.timezone} />
          ) : (
            <QuickMood seed={seedFrom(`${user.id}:${today}`)} />
          )}
        </section>

        {suggestions.length ? (
          <section aria-labelledby="for-you-heading" className="flex flex-col gap-4 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6">
            <h2 id="for-you-heading" className="text-[17px] font-semibold text-ink">
              For how you feel
            </h2>
            <ul className="grid gap-2 sm:grid-cols-3">
              {suggestions.map((s) => (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    className="group flex h-full flex-col gap-2 rounded-[16px] bg-surface p-4 transition-colors hover:bg-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <span className="text-[13px] text-muted">{s.reason}</span>
                    <span className="text-[15px] leading-snug font-medium text-ink">{s.title}</span>
                    <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[14px] font-medium text-accent-ink">
                      {s.cta}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!yesterday && profile.onboarded_at!.slice(0, 10) < today ? (
          <Link href={routes.checkInFor(addDays(today, -1))} className="self-start text-[14px] font-medium text-muted hover:text-ink hover:underline">
            Missed yesterday? Add how it went
          </Link>
        ) : null}

        {memories.length ? (
          <section aria-labelledby="memories-heading" className="flex flex-col gap-4 rounded-[var(--radius-panel)] bg-sand p-5 sm:p-6">
            <h2 id="memories-heading" className="text-[17px] font-semibold text-ink">
              On this day
            </h2>
            <ul className="flex flex-col gap-2">
              {memories.map((m) => (
                <li key={m.id}>
                  <Link href={routes.journalEntry(m.id)} className="flex flex-col gap-1 rounded-[16px] bg-surface p-4 transition-colors hover:bg-active">
                    <span className="text-[13px] text-muted">
                      {m.ago}, {relativeDay(m.local_date, today)}
                    </span>
                    {m.title || m.prompt_body ? <span className="text-[15px] font-medium text-ink">{m.title ?? m.prompt_body}</span> : null}
                    <span className="line-clamp-3 font-serif text-[16px] leading-snug text-ink">{m.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 lg:col-span-4">
      <section aria-labelledby="quote-heading" className="flex flex-col gap-6 rounded-[var(--radius-panel)] bg-sand p-6">
        <h2 id="quote-heading" className="text-[14px] font-medium text-muted">
          A thought for today
        </h2>
        {quote ? (
          <figure className="flex flex-col gap-4">
            <blockquote className="font-serif text-[24px] leading-[1.3] tracking-[-0.005em] text-ink sm:text-[26px]">{quote.body}</blockquote>
            {quote.author ? (
              <figcaption className="text-[14px] text-muted">
                {quote.author}
                {quote.source ? <span className="block text-[13px] text-faint">{quote.source}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        ) : (
          <p className="font-serif text-[22px] text-ink">Notice what you can change today.</p>
        )}
      </section>
      <section aria-labelledby="write-heading" className="flex flex-col gap-5 rounded-[var(--radius-panel)] bg-raised p-6">
        <div className="flex items-center justify-between">
          <h2 id="write-heading" className="text-[17px] font-semibold text-ink">
            Write
          </h2>
          <Link href={routes.journal} className="text-[14px] font-medium text-accent-ink hover:underline">
            Journal
          </Link>
        </div>
        {prompt ? <p className="font-serif text-[22px] leading-snug text-ink">{prompt.body}</p> : null}
        <div className="mt-auto flex flex-wrap gap-2">
          <Link href={`${routes.newJournalEntry}?prompt=today`} className={buttonVariants({ size: "md" })}>
            Write about this
            <ArrowRight aria-hidden />
          </Link>
          <Link href={routes.newJournalEntry} className={buttonVariants({ variant: "outline", size: "md" })}>
            <PenLine aria-hidden />
            Free writing
          </Link>
        </div>
      </section>
      <section aria-labelledby="goals-heading" className="flex flex-1 flex-col gap-5 rounded-[var(--radius-panel)] bg-raised p-6">
        <div className="flex items-center justify-between">
          <h2 id="goals-heading" className="text-[17px] font-semibold text-ink">
            Towards your goals
          </h2>
          <Link href={routes.goals} className="text-[14px] font-medium text-accent-ink hover:underline">
            My goals
          </Link>
        </div>
        {steps === null ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[15px] text-muted">Goal prompts are off. Turn them on to see the next step of each goal here.</p>
            <Link href={`${routes.settings}#preferences`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Turn on goal prompts
            </Link>
          </div>
        ) : steps.length ? (
          <div className="flex flex-col gap-4">
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col gap-2">
                <Link href={routes.goal(s.goal.id)} className="text-[14px] text-muted hover:text-ink">
                  {s.goal.title}
                </Link>
                <StepList goalId={s.goal.id} steps={[s]} today={today} editable={false} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[15px] text-muted">Set a goal and its first small steps. The next one will wait for you here.</p>
            <Link href={routes.newGoal} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Set a goal
              <ArrowRight aria-hidden />
            </Link>
          </div>
        )}
      </section>
      </div>

      <section aria-labelledby="track-heading" className="flex flex-col gap-5 rounded-[var(--radius-panel)] bg-raised p-6 lg:col-span-7 lg:self-start">
        <div className="flex items-baseline justify-between">
          <h2 id="track-heading" className="text-[17px] font-semibold text-ink">
            Other things to track
          </h2>
          <p className="text-[14px] text-muted">Today</p>
        </div>
        <TrackerPanel initial={trackers} />
      </section>

      <section aria-labelledby="control-heading" className="flex flex-col gap-5 rounded-[var(--radius-panel)] bg-sand p-6 lg:col-span-5">
        <h2 id="control-heading" className="text-[17px] font-semibold text-ink">
          What can I control?
        </h2>
        {thoughts.length ? (
          <ul className="flex flex-col gap-1.5">
            {thoughts.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-[14px] bg-surface px-4 py-2.5">
                <span className="min-w-0 truncate text-[15px] text-ink">{t.body}</span>
                <span className={cn("shrink-0 text-[13px]", t.zone === "control" ? "font-medium text-accent-ink" : "text-muted")}>
                  {t.zone ? ZONES.find((z) => z.value === t.zone)?.short : "Not sorted"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-serif text-[22px] leading-snug text-ink">
            Sort what is on your mind into what you control, what you can influence, and what you can set down.
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-4 pt-1">
          <Link href={routes.control} className={buttonVariants({ variant: "primary", size: "md" })}>
            {thoughts.length ? "Open my circle" : "Start sorting"}
            <ArrowRight aria-hidden />
          </Link>
          {thoughts.length ? (
            <p className="num text-[14px] text-muted">
              {sorted} of {thoughts.length} sorted
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="mb-4 lg:col-span-12 lg:mb-8">
        <Skeleton className="h-10 w-2/3 max-w-[440px] sm:h-12" />
        <Skeleton className="mt-4 h-5 w-1/2 max-w-[360px]" />
      </div>
      <Skeleton className="h-[640px] rounded-[var(--radius-panel)] lg:col-span-8" />
      <div className="flex flex-col gap-4 lg:col-span-4">
        <Skeleton className="h-[220px] rounded-[var(--radius-panel)]" />
        <Skeleton className="h-[200px] rounded-[var(--radius-panel)]" />
        <Skeleton className="h-[200px] rounded-[var(--radius-panel)]" />
      </div>
      <Skeleton className="h-[340px] rounded-[var(--radius-panel)] lg:col-span-7" />
      <Skeleton className="h-[340px] rounded-[var(--radius-panel)] lg:col-span-5" />
    </div>
  );
}
