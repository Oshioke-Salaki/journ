import { PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { JournalSearch } from "@/features/journal/components/journal-search";
import { listEntries, type EntrySummary } from "@/features/journal/queries";
import { requireMember } from "@/lib/auth/session";
import { formatDate, relativeDay } from "@/lib/dates";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage({ searchParams }: PageProps<"/journal">) {
  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Journal"
        description="Everything you have written, newest first. Only you can see it."
        actions={
          <Link href={routes.newJournalEntry} className={buttonVariants({ size: "md" })}>
            <PenLine aria-hidden />
            New entry
          </Link>
        }
      />
      <Suspense fallback={<EntryListSkeleton />}>
        <Entries searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function Entries({ searchParams }: Pick<PageProps<"/journal">, "searchParams">) {
  const [{ today }, params] = await Promise.all([requireMember(), searchParams]);
  const q = typeof params.q === "string" ? params.q : "";
  const entries = await listEntries(200, q);

  if (q) {
    return (
      <>
        <JournalSearch initial={q} />
        {entries.length ? <EntryGroups entries={entries} today={today} label={`${entries.length === 1 ? "1 entry" : `${entries.length} entries`} matching “${q}”`} /> : (
          <EmptyState title={`Nothing matches “${q}”`}>Try a different word, or clear the search to see everything.</EmptyState>
        )}
      </>
    );
  }

  if (!entries.length) {
    return (
      <EmptyState
        title="Your journal is empty"
        action={
          <Link href={`${routes.newJournalEntry}?prompt=today`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Start with today&rsquo;s prompt
          </Link>
        }
      >
        Write a few lines about today. Short is fine.
      </EmptyState>
    );
  }

  return (
    <>
      <JournalSearch initial="" />
      <EntryGroups entries={entries} today={today} label={entries.length === 1 ? "1 entry" : `${entries.length} entries`} />
    </>
  );
}

function EntryGroups({ entries, today, label }: { entries: EntrySummary[]; today: string; label: string }) {
  const groups = new Map<string, EntrySummary[]>();
  for (const entry of entries) {
    const key = entry.local_date.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return (
    <div className="flex flex-col gap-10">
      <p className="num -mt-4 text-[14px] text-muted" aria-live="polite">{label}</p>
      {[...groups].map(([month, items]) => (
        <section key={month} aria-labelledby={`month-${month}`}>
          <h2 id={`month-${month}`} className="mb-3 text-[15px] font-semibold text-ink">
            {formatDate(`${month}-01`, { month: "long", year: "numeric" })}
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((entry) => (
              <li key={entry.id}>
                <EntryRow entry={entry} today={today} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function EntryRow({ entry, today }: { entry: EntrySummary; today: string }) {
  const heading = entry.title ?? entry.prompt_body ?? firstLine(entry.body);
  const excerpt = entry.title || entry.prompt_body ? entry.body : entry.body.slice(firstLine(entry.body).length).trim();
  return (
    <Link
      href={routes.journalEntry(entry.id)}
      className="group flex flex-col gap-1 rounded-[18px] bg-raised px-5 py-4 transition-colors hover:bg-active active:scale-[0.995]"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="line-clamp-1 text-[16px] font-medium text-ink">{heading}</p>
        <p className="shrink-0 text-[13px] text-muted">{relativeDay(entry.local_date, today)}</p>
      </div>
      {excerpt ? <p className="line-clamp-2 font-serif text-[16px] leading-relaxed text-muted">{excerpt}</p> : null}
    </Link>
  );
}

function firstLine(text: string) {
  const line = text.trim().split("\n")[0] ?? "";
  return line.length > 80 ? `${line.slice(0, 80).trimEnd()}…` : line;
}

function EntryListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="mb-4 h-4 w-20" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[84px] rounded-[18px]" />
      ))}
    </div>
  );
}
