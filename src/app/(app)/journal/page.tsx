import { PenLine, Printer, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { JournalSearch } from "@/features/journal/components/journal-search";
import { listEntries, listTags, type EntrySummary } from "@/features/journal/queries";
import { requireMember } from "@/lib/auth/session";
import { formatDate, relativeDay } from "@/lib/dates";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage({ searchParams }: PageProps<"/journal">) {
  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Journal"
        description="Everything you have written, newest first. Only you can see it."
        actions={
          <>
            <Link href={routes.journalPrint()} className={buttonVariants({ variant: "secondary", size: "md" })}>
              <Printer aria-hidden />
              <span className="max-sm:sr-only">Print</span>
            </Link>
            <Link href={routes.newJournalEntry} className={buttonVariants({ size: "md" })}>
              <PenLine aria-hidden />
              New entry
            </Link>
          </>
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
  const tag = typeof params.tag === "string" ? params.tag.slice(0, 30) : "";
  const [entries, tags] = await Promise.all([listEntries(200, q, tag || undefined), listTags()]);
  const count = entries.length === 1 ? "1 entry" : `${entries.length} entries`;

  if (q || tag) {
    const what = [q ? `matching “${q}”` : null, tag ? `tagged #${tag}` : null].filter(Boolean).join(" and ");
    const none = [q ? `Nothing matches “${q}”` : "Nothing", tag ? `tagged #${tag}` : null].filter(Boolean).join(" ");
    return (
      <>
        <JournalSearch initial={q} tag={tag} />
        <TagFilter tags={tags} active={tag} q={q} />
        {entries.length ? (
          <EntryGroups entries={entries} today={today} label={`${count} ${what}`} />
        ) : (
          <EmptyState title={none}>Try a different word or tag, or clear the filters to see everything.</EmptyState>
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
      <TagFilter tags={tags} active="" q="" />
      <EntryGroups entries={entries} today={today} label={count} />
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
      {entry.tags.length ? <p className="mt-1 truncate text-[13px] text-muted">{entry.tags.map((t) => `#${t}`).join("  ")}</p> : null}
    </Link>
  );
}

/** The member's tags as filters. Tapping the active one clears it. */
function TagFilter({ tags, active, q }: { tags: { tag: string; n: number }[]; active: string; q: string }) {
  if (!tags.length) return null;
  const href = (tag: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    const query = params.toString();
    return query ? `${routes.journal}?${query}` : routes.journal;
  };
  return (
    <nav aria-label="Filter by tag" className="scrollbar-none -mx-4 -mt-4 mb-8 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {tags.slice(0, 20).map(({ tag, n }) => {
        const on = tag === active;
        return (
          <Link
            key={tag}
            href={href(on ? "" : tag)}
            aria-current={on ? "true" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] transition-colors",
              on ? "bg-primary text-on-primary" : "bg-raised text-ink hover:bg-active",
            )}
          >
            #{tag}
            {on ? <X className="size-3.5" aria-label="Clear" /> : <span className="num text-[12px] text-muted">{n}</span>}
          </Link>
        );
      })}
    </nav>
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
