import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Wordmark } from "@/components/brand/mark";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";
import { getProfile, requireUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <div className="min-h-dvh bg-surface px-5 pt-safe pb-safe sm:px-10">
      <header className="mx-auto flex h-[72px] max-w-[560px] items-center">
        <Wordmark />
      </header>
      <main className="mx-auto flex max-w-[560px] pt-6 pb-16 sm:pt-12">
        <Suspense fallback={<OnboardingSkeleton />}>
          <Onboarding />
        </Suspense>
      </main>
    </div>
  );
}

async function Onboarding() {
  await requireUser();
  const profile = await getProfile();
  if (profile?.onboarded_at) redirect(routes.today);
  return <OnboardingFlow defaultName={profile?.display_name ?? ""} />;
}

function OnboardingSkeleton() {
  return (
    <div className="flex w-full flex-col">
      <Skeleton className="mb-8 h-1 w-full rounded-full" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="mt-3 mb-8 h-5 w-2/3" />
      <Skeleton className="h-12 w-full rounded-[14px]" />
    </div>
  );
}
