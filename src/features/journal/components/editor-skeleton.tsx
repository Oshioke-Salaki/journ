import { Skeleton } from "@/components/ui/skeleton";

export function EditorSkeleton() {
  return (
    <div className="min-h-dvh bg-surface">
      <div className="mx-auto flex h-[60px] max-w-[760px] items-center justify-between px-4 sm:px-8">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <div className="mx-auto max-w-[760px] px-4 pt-12 sm:px-8">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="mt-6 h-5 w-full" />
        <Skeleton className="mt-3 h-5 w-5/6" />
      </div>
    </div>
  );
}
