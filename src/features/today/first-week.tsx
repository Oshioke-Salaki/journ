import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { SetupProgress, SetupStep } from "./queries";
import { DismissChecklistButton } from "./dismiss-checklist-button";

const STEPS: { id: SetupStep; label: string; detail: string; href: string }[] = [
  { id: "check-in", label: "Check in", detail: "Notice how you feel, in under a minute.", href: routes.checkIn },
  { id: "journal", label: "Write your first entry", detail: "A line is enough to start.", href: routes.newJournalEntry },
  { id: "control", label: "Sort one thought", detail: "Is it yours to act on, or to set down?", href: routes.control },
  { id: "goal", label: "Set a goal", detail: "Something you want, and the first small step.", href: routes.newGoal },
  { id: "vision", label: "Add to your vision board", detail: "A picture of the life you're building.", href: routes.vision },
];

/** The first things to try, on Today, until they are done or she hides the list. */
export function FirstWeek({ progress }: { progress: SetupProgress }) {
  const done = STEPS.filter((s) => progress[s.id]).length;
  return (
    <section aria-labelledby="first-week-heading" className="flex flex-col gap-5 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6 lg:col-span-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="first-week-heading" className="text-[17px] font-semibold text-ink">
            Your first week
          </h2>
          <p className="text-[15px] text-muted">
            <span className="num">{done}</span> of <span className="num">{STEPS.length}</span> done. Five small ways to make JournApp yours.
          </p>
        </div>
        <DismissChecklistButton />
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-active" role="progressbar" aria-label="First week progress" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={done}>
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(done / STEPS.length) * 100}%` }} />
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s) => {
          const complete = progress[s.id];
          return (
            <li key={s.id}>
              <Link
                href={s.href}
                className={cn(
                  "flex h-full items-start gap-3 rounded-[16px] bg-surface p-4 transition-colors hover:bg-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  complete && "opacity-70",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                    complete ? "border-primary bg-primary text-on-primary" : "border-control",
                  )}
                  aria-hidden
                >
                  {complete ? <Check className="size-3.5" strokeWidth={3} /> : null}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className={cn("text-[15px] font-medium text-ink", complete && "line-through decoration-faint")}>
                    {s.label}
                    {complete ? <span className="sr-only"> (done)</span> : null}
                  </span>
                  <span className="text-[13px] text-muted">{s.detail}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export const SETUP_STEP_COUNT = STEPS.length;
