import type { Metadata } from "next";
import { Suspense } from "react";
import { seedFrom } from "@/components/brand/landscape";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckInFlow, type CheckInDraft } from "@/features/check-in/components/check-in-flow";
import { FEELINGS, type Feeling } from "@/features/check-in/constants";
import { getCheckIn } from "@/features/check-in/queries";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Check in" };

export default function CheckInPage({ searchParams }: PageProps<"/check-in">) {
  return (
    <div className="min-h-dvh bg-surface">
      <Suspense fallback={<CheckInSkeleton />}>
        <CheckIn searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CheckIn({ searchParams }: Pick<PageProps<"/check-in">, "searchParams">) {
  const [{ user, today }, params] = await Promise.all([requireMember(), searchParams]);
  const existing = await getCheckIn(today);
  const moodParam = Number(params.mood);
  const presetMood = Number.isInteger(moodParam) && moodParam >= 1 && moodParam <= 5 ? moodParam : null;

  const initial: CheckInDraft = existing
    ? {
        mood: presetMood ?? existing.mood,
        energy: existing.energy,
        efficiency: existing.efficiency,
        selfSatisfaction: existing.self_satisfaction,
        body: existing.body,
        feelings: existing.feelings.filter((f): f is Feeling => (FEELINGS as readonly string[]).includes(f)),
        note: existing.note ?? "",
      }
    : { mood: presetMood, energy: null, efficiency: null, selfSatisfaction: null, body: [], feelings: [], note: "" };

  return <CheckInFlow initial={initial} isUpdate={Boolean(existing)} seed={seedFrom(`${user.id}:${today}`)} />;
}

function CheckInSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col px-4 pt-safe sm:px-8">
      <div className="flex h-[64px] items-center">
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
      <Skeleton className="mt-2 aspect-[16/7] w-full rounded-[24px] sm:aspect-[16/6]" />
      <Skeleton className="mt-8 h-8 w-3/4" />
      <Skeleton className="mt-3 h-5 w-1/2" />
      <div className="mt-8 grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-[16px] sm:h-[96px]" />
        ))}
      </div>
    </div>
  );
}
