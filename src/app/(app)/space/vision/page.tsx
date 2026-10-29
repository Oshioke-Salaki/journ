import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listVisionItems } from "@/features/vision/queries";
import { VisionBoard } from "@/features/vision/vision-board";
import { requireMember } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "My vision board" };

export default function VisionPage() {
  return (
    <PageContainer>
      <Link href={routes.space} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-4 mb-6")}>
        <ArrowLeft aria-hidden />
        My Space
      </Link>
      <PageHeader title="My vision board" description="The places, people and words that remind you where you are going." />
      <Suspense fallback={<BoardSkeleton />}>
        <Board />
      </Suspense>
    </PageContainer>
  );
}

async function Board() {
  const { user } = await requireMember();
  const items = await listVisionItems();
  return <VisionBoard items={items} userId={user.id} />;
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-2">
        <Skeleton className="h-11 w-40 rounded-full" />
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>
      <div className="columns-2 gap-4 lg:columns-3">
        {[220, 160, 260, 180, 200, 140].map((h, i) => (
          <Skeleton key={i} className="mb-4 rounded-[18px]" style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}
