import { PenLine } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Wordmark } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { AccountButton, AccountRow, AccountRowSkeleton } from "./account-link";
import { SidebarNav, TabBar } from "./nav";

/**
 * The signed-in frame. Desktop (lg+): a sidebar on the tinted ground and the page on a white sheet
 * inset 8px from the window. Phone and tablet portrait: a top bar and the four-tab bar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[252px_minmax(0,1fr)] lg:bg-ground">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 px-4 pt-6 pb-4 lg:flex">
        <Link href={routes.today} className="px-2" aria-label="JournApp, Today">
          <Wordmark />
        </Link>
        <SidebarNav />
        <Link href={routes.newJournalEntry} className={cn(buttonVariants({ variant: "primary", size: "md" }), "justify-start")}>
          <PenLine aria-hidden />
          Write
        </Link>
        <div className="mt-auto">
          <Suspense fallback={<AccountRowSkeleton />}>
            <AccountRow />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col lg:py-2 lg:pr-2">
        <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b border-rule bg-surface px-4 pt-safe sm:px-6 lg:hidden">
          <Link href={routes.today} aria-label="JournApp, Today">
            <Wordmark />
          </Link>
          <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
            <AccountButton />
          </Suspense>
        </header>

        <main
          id="main"
          className="flex-1 bg-surface pb-[calc(58px+env(safe-area-inset-bottom)+24px)] lg:rounded-[18px] lg:border lg:border-border lg:pb-0"
        >
          {children}
        </main>
      </div>

      <TabBar />
    </div>
  );
}
