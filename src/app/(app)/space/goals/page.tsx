import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { GoalCard } from "@/features/goals/components/goal-card";
import { listGoals } from "@/features/goals/queries";
import { requireMember } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "My goals" };

const GROUPS = [
  { status: "active", title: "In progress" },
  { status: "paused", title: "Paused" },
  { status: "achieved", title: "Achieved" },
] as const;

export default function GoalsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="My goals"
        description="What you are working towards, one small step at a time."
        actions={
          <Link href={routes.newGoal} className={buttonVariants({ size: "md" })}>
            <Plus aria-hidden />
            Set a goal
          </Link>
        }
      />
      <Suspense fallback={<GoalsSkeleton />}>
        <Goals />
      </Suspense>
    </PageContainer>
  );
}

async function Goals() {
  await requireMember();
  const goals = await listGoals();
  if (!goals.length) {
    return (
      <EmptyState
        title="You haven't set a goal yet"
        action={
          <Link href={routes.newGoal} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Set your first goal
          </Link>
        }
      >
        Pick one thing within your control and break it into small steps.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-10">
      {GROUPS.map((group) => {
        const items = goals.filter((g) => g.status === group.status);
        if (!items.length) return null;
        return (
          <section key={group.status} aria-labelledby={`group-${group.status}`} className="flex flex-col gap-4">
            <h2 id={`group-${group.status}`} className="text-[17px] font-semibold text-ink">
              {group.title} <span className="num font-normal text-muted">{items.length}</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((g) => (
                <li key={g.id}>
                  <GoalCard goal={g} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-[150px] rounded-[20px]" />
      ))}
    </div>
  );
}
