import { ArrowLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/shell/page";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteEntryButton } from "@/features/journal/components/delete-entry-button";
import { getEntry } from "@/features/journal/queries";
import { wordCount } from "@/features/journal/schemas";
import { requireMember } from "@/lib/auth/session";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Journal entry" };

export default function EntryPage({ params }: PageProps<"/journal/[id]">) {
  return (
    <PageContainer width="narrow">
      <Link href={routes.journal} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-4 mb-6")}>
        <ArrowLeft aria-hidden />
        Journal
      </Link>
      <Suspense fallback={<EntrySkeleton />}>
        <Entry params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function Entry({ params }: Pick<PageProps<"/journal/[id]">, "params">) {
  const [{ id }] = await Promise.all([params, requireMember()]);
  const entry = /^[0-9a-f-]{36}$/i.test(id) ? await getEntry(id) : null;
  if (!entry) notFound();
  const words = wordCount(entry.body);

  return (
    <article className="flex flex-col">
      <p className="num text-[14px] text-muted">
        {formatDate(entry.local_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} ·{" "}
        {words === 1 ? "1 word" : `${words.toLocaleString("en")} words`}
      </p>
      <h1 className="mt-3 text-[28px] leading-[1.15] font-semibold tracking-[-0.02em] text-ink sm:text-[34px]">
        {entry.title ?? (entry.prompt_body ? "A prompted entry" : "Untitled entry")}
      </h1>
      {entry.prompt_body ? (
        <p className="mt-6 rounded-[18px] bg-sand px-5 py-4 font-serif text-[18px] leading-snug text-ink italic">{entry.prompt_body}</p>
      ) : null}
      <div className="mt-8 font-serif text-[19px] leading-[1.75] whitespace-pre-wrap text-ink sm:text-[20px]">{entry.body}</div>
      <div className="mt-12 flex items-center gap-2 border-t border-rule pt-6">
        <Link href={`${routes.journalEntry(entry.id)}/edit`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <Pencil aria-hidden />
          Edit
        </Link>
        <DeleteEntryButton entryId={entry.id} />
      </div>
    </article>
  );
}

function EntrySkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-4 h-9 w-2/3" />
      <Skeleton className="mt-8 h-5 w-full" />
      <Skeleton className="mt-3 h-5 w-full" />
      <Skeleton className="mt-3 h-5 w-3/4" />
    </div>
  );
}
