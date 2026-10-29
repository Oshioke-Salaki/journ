import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import { routes } from "@/lib/routes";
import { areaName, GOAL_STATUS_LABEL } from "../constants";
import { progress, type Goal } from "../queries";

export function ProgressBar({ ratio, className, label }: { ratio: number; className?: string; label: string }) {
  const pct = Math.round(ratio * 100);
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-active", className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function GoalCard({ goal, className }: { goal: Goal; className?: string }) {
  const p = progress(goal);
  return (
    <Link
      href={routes.goal(goal.id)}
      className={cn("flex h-full flex-col gap-4 rounded-[20px] bg-raised p-5 transition-colors hover:bg-active active:scale-[0.995]", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[17px] leading-snug font-medium text-ink">{goal.title}</p>
        {goal.status !== "active" ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
              goal.status === "achieved" ? "bg-accent-soft text-accent-ink" : "bg-active text-muted",
            )}
          >
            {GOAL_STATUS_LABEL[goal.status]}
          </span>
        ) : null}
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <ProgressBar ratio={p.ratio} label={`${goal.title}: ${p.done} of ${p.total} steps done`} />
        <div className="num flex justify-between text-[13px] text-muted">
          <span>{p.total ? `${p.done} of ${p.total} steps` : "No steps yet"}</span>
          <span>
            {areaName(goal.area)}
            {goal.target_date ? ` · by ${formatDate(goal.target_date, { day: "numeric", month: "short" })}` : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
