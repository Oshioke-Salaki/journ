import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { areaName, GOAL_STATUS_LABEL } from "@/features/goals/constants";
import { GoalActions } from "@/features/goals/components/goal-actions";
import { ProgressBar } from "@/features/goals/components/goal-card";
import { StepList } from "@/features/goals/components/step-list";
import { getGoal, progress } from "@/features/goals/queries";
import { requireMember } from "@/lib/auth/session";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Goal" };

export default function GoalPage({ params }: PageProps<"/space/goals/[id]">) {
  return (
    <PageContainer width="narrow">
      <Link href={routes.goals} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-4 mb-6")}>
        <ArrowLeft aria-hidden />
        My goals
      </Link>
      <Suspense fallback={<GoalSkeleton />}>
        <GoalDetail params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function GoalDetail({ params }: Pick<PageProps<"/space/goals/[id]">, "params">) {
  const [{ id }, { today }] = await Promise.all([params, requireMember()]);
  const goal = /^[0-9a-f-]{36}$/i.test(id) ? await getGoal(id) : null;
  if (!goal) notFound();
  const p = progress(goal);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <p className="text-[14px] text-muted">
          {GOAL_STATUS_LABEL[goal.status]} · {areaName(goal.area)}
          {goal.target_date ? ` · by ${formatDate(goal.target_date, { day: "numeric", month: "long", year: "numeric" })}` : ""}
        </p>
        <h1 className="text-[30px] leading-[1.12] font-semibold tracking-[-0.02em] text-ink sm:text-[36px]">{goal.title}</h1>
        {goal.why ? <p className="font-serif text-[20px] leading-relaxed text-ink">{goal.why}</p> : null}
        <ProgressBar ratio={p.ratio} label={`${p.done} of ${p.total} steps done`} className="mt-2" />
        <GoalActions goal={{ id: goal.id, title: goal.title, why: goal.why, area: goal.area, target_date: goal.target_date, status: goal.status }} />
      </header>
      <section aria-labelledby="steps-heading" className="flex flex-col gap-4">
        <h2 id="steps-heading" className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
          Steps
        </h2>
        <StepList goalId={goal.id} steps={goal.goal_steps} today={today} />
      </section>
    </div>
  );
}

function GoalSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="mt-8 h-14 w-full rounded-[16px]" />
      <Skeleton className="h-14 w-full rounded-[16px]" />
    </div>
  );
}
