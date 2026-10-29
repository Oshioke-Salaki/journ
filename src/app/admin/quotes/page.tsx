import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteButton, LiveSwitch } from "@/features/admin/components/row-actions";
import { QuoteDialog } from "@/features/admin/components/text-editor-dialog";
import { adminQuotes } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { AdminHeader } from "../admin-header";

export const metadata: Metadata = { title: "Quotes" };

export default function AdminQuotesPage() {
  return (
    <>
      <AdminHeader title="Quotes" description="One live quote is shown on Today each day, the same for everyone, in rotation." action={<QuoteDialog />} />
      <Suspense fallback={<Skeleton className="h-[420px] rounded-[18px]" />}>
        <Quotes />
      </Suspense>
    </>
  );
}

async function Quotes() {
  await requireAdmin();
  const quotes = await adminQuotes();
  return (
    <div className="overflow-hidden rounded-[18px] border border-border">
      <p className="num border-b border-rule px-5 py-3 text-[14px] text-muted">
        {quotes.length} quotes · {quotes.filter((q) => q.is_active).length} live
      </p>
      {quotes.length === 0 ? (
        <p className="px-5 py-8 text-[15px] text-muted">No quotes yet. Add a quote. One live quote is shown on Today each day.</p>
      ) : null}
      <ul className="divide-y divide-rule">
        {quotes.map((q) => (
          <li key={q.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[17px] leading-snug text-ink">{q.body}</p>
              <p className="text-[13px] text-muted">{q.author ?? "JournApp"}</p>
            </div>
            <QuoteDialog id={q.id} initial={{ body: q.body, author: q.author ?? "", source: q.source ?? "" }} />
            <LiveSwitch table="quotes" id={q.id} active={q.is_active} label={q.body.slice(0, 40)} />
            <DeleteButton table="quotes" id={q.id} label={q.body.slice(0, 60)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
