import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { PrintButton } from "@/features/journal/components/print-button";
import { listEntriesBetween } from "@/features/journal/queries";
import { JournalDocument } from "@/features/journal/rich/read-view";
import type { DocNode } from "@/features/journal/rich/document";
import { firstName, requireMember } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { formatDate, monthGrid, shiftMonth } from "@/lib/dates";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Print journal", robots: { index: false } };

export default function PrintJournalPage({ searchParams }: PageProps<"/journal/print">) {
  return (
    <div className="mx-auto w-full max-w-[760px] px-5 pt-safe pb-24 print:max-w-none print:px-0 print:pb-0">
      <Suspense fallback={<PrintSkeleton />}>
        <PrintJournal searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PrintJournal({ searchParams }: Pick<PageProps<"/journal/print">, "searchParams">) {
  const [{ profile, today }, params] = await Promise.all([requireMember(), searchParams]);
  const thisMonth = today.slice(0, 7);
  const month = typeof params.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month) && params.month <= thisMonth ? params.month : null;
  const { first, last } = month ? monthGrid(month) : { first: "1900-01-01", last: today };
  const entries = await listEntriesBetween(first, last);
  const months = Array.from({ length: 12 }, (_, i) => shiftMonth(thisMonth, -i));
  const name = firstName(profile);
  const heading = month ? formatDate(`${month}-01`, { month: "long", year: "numeric" }) : "My journal";

  return (
    <>
      <div className="flex flex-col gap-5 py-6 print:hidden">
        <Link href={routes.journal} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-4 self-start")}>
          <ArrowLeft aria-hidden />
          Journal
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink">Print your journal</h1>
            <p className="mt-1 text-[15px] text-muted">Choose a month or everything, then print it or save it as a PDF.</p>
          </div>
          <PrintButton disabled={!entries.length} />
        </div>
        <nav aria-label="Which entries" className="scrollbar-none -mx-5 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
          {[null, ...months].map((m) => {
            const on = m === month;
            return (
              <Link
                key={m ?? "all"}
                href={routes.journalPrint(m ?? undefined)}
                aria-current={on ? "page" : undefined}
                className={cn("inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[14px] transition-colors", on ? "bg-primary text-on-primary" : "bg-raised text-ink hover:bg-active")}
              >
                {m ? formatDate(`${m}-01`, { month: "short", year: m.slice(0, 4) === thisMonth.slice(0, 4) ? undefined : "numeric" }) : "Everything"}
              </Link>
            );
          })}
        </nav>
      </div>

      {entries.length ? (
        <article className="flex flex-col border-t border-rule pt-10 print:border-0 print:pt-0">
          <header className="mb-10 print:mb-12">
            <p className="text-[14px] text-muted">{name ? `${name}'s journal` : "JournApp journal"}</p>
            <h2 className="mt-1 font-serif text-[34px] leading-tight text-ink">{heading}</h2>
            <p className="num mt-1 text-[14px] text-muted">{entries.length === 1 ? "1 entry" : `${entries.length} entries`}</p>
          </header>
          {entries.map((e) => (
            <section key={e.id} className="break-inside-avoid-page border-t border-rule py-8 first-of-type:border-0 first-of-type:pt-0">
              <p className="text-[13px] text-muted">{formatDate(e.local_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
              {e.title ? <h3 className="mt-1 text-[21px] font-semibold text-ink">{e.title}</h3> : null}
              {e.prompt_body ? <p className="mt-3 font-serif text-[17px] text-muted italic">{e.prompt_body}</p> : null}
              {e.tags.length ? <p className="mt-2 text-[13px] text-muted">{e.tags.map((t) => `#${t}`).join("  ")}</p> : null}
              <div className="mt-4">
                <JournalDocument doc={e.body_doc as DocNode | null} text={e.body} />
              </div>
            </section>
          ))}
        </article>
      ) : (
        <EmptyState title={month ? `Nothing written in ${heading}` : "Your journal is empty"}>Pick another month, or write an entry first.</EmptyState>
      )}
    </>
  );
}

function PrintSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-6">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="mt-6 h-[420px] w-full rounded-[18px]" />
    </div>
  );
}
