import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalForm } from "@/features/goals/components/goal-form";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Set a goal" };

export default function NewGoalPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader title="Set a goal" description="Choose something within your control. Small and specific beats big and vague." />
      <Suspense fallback={<FormSkeleton />}>
        <NewGoal />
      </Suspense>
    </PageContainer>
  );
}

async function NewGoal() {
  await requireMember();
  return <GoalForm />;
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-12 w-full rounded-[14px]" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-24 w-full rounded-[14px]" />
    </div>
  );
}
