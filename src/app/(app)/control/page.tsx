import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { Skeleton } from "@/components/ui/skeleton";
import { ControlBoard } from "@/features/control/control-board";
import { listControlItems } from "@/features/control/queries";
import { listGoals } from "@/features/goals/queries";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "What can I control?" };

export default function ControlPage() {
  return (
    <PageContainer>
      <PageHeader
        title="What can I control?"
        description="Write down what is on your mind, then sort each thought. Act on what you control, do your part where you have influence, and set the rest down."
      />
      <Suspense fallback={<ControlSkeleton />}>
        <Control />
      </Suspense>
    </PageContainer>
  );
}

async function Control() {
  const { today } = await requireMember();
  const [items, goals] = await Promise.all([listControlItems(today), listGoals()]);
  return (
    <ControlBoard
      items={items.map((i) => ({ id: i.id, body: i.body, zone: i.zone, goal_step_id: i.goal_step_id }))}
      goals={goals.filter((g) => g.status === "active").map((g) => ({ id: g.id, title: g.title }))}
    />
  );
}

function ControlSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Skeleton className="h-[260px] rounded-[var(--radius-panel)] lg:col-span-7" />
      <Skeleton className="h-[260px] rounded-[var(--radius-panel)] lg:col-span-5" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-[180px] rounded-[var(--radius-panel)] lg:col-span-4" />
      ))}
    </div>
  );
}
