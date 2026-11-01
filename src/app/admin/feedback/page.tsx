import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { MarkFeedbackButton } from "@/features/admin/components/feedback-actions";
import { adminFeedback } from "@/features/admin/queries";
import { FEEDBACK_KINDS } from "@/features/feedback/schemas";
import { requireAdmin } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { AdminHeader } from "../admin-header";

export const metadata: Metadata = { title: "Inbox" };

const FILTERS = [
  { value: "new", label: "New" },
  { value: "done", label: "Handled" },
  { value: "all", label: "All" },
] as const;

export default function AdminFeedbackPage({ searchParams }: PageProps<"/admin/feedback">) {
  return (
    <>
      <AdminHeader title="Inbox" description="Ideas, problems and questions members send from Settings. Reply by email; mark each one handled when done." />
      <Suspense fallback={<Skeleton className="h-[420px] rounded-[18px]" />}>
        <Inbox searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Inbox({ searchParams }: Pick<PageProps<"/admin/feedback">, "searchParams">) {
  const [, params] = await Promise.all([requireAdmin(), searchParams]);
  const filter = FILTERS.find((f) => f.value === params.show)?.value ?? "new";
  const items = await adminFeedback(filter === "all" ? null : filter);

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filter messages" className="flex gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/feedback?show=${f.value}`}
            aria-current={f.value === filter ? "page" : undefined}
            className={cn(
              "h-9 rounded-full px-4 text-[14px] leading-9 font-medium transition-colors",
              f.value === filter ? "bg-primary text-on-primary" : "text-muted hover:bg-raised hover:text-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {items.length ? (
        <ul className="flex flex-col gap-3">
          {items.map((m) => (
            <li key={m.id} className="flex flex-col gap-3 rounded-[18px] border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-ink">
                    {FEEDBACK_KINDS.find((k) => k.value === m.kind)?.label}
                    <span className="font-normal text-muted"> from {m.display_name ?? "a member"}</span>
                  </p>
                  <p className="text-[13px] text-muted">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent("Your JournApp feedback")}`} className="text-accent-ink hover:underline">
                      {m.email}
                    </a>{" "}
                    · {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(new Date(m.created_at))}
                  </p>
                </div>
                <MarkFeedbackButton id={m.id} done={m.status === "done"} />
              </div>
              <p className="text-[15px] whitespace-pre-wrap text-ink">{m.body}</p>
              {m.page ? <p className="truncate text-[12px] text-faint">{m.page}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={filter === "new" ? "Nothing new" : "No messages here"}>
          {filter === "new" ? "New messages from members appear here." : "Messages members send from Settings are listed here."}
        </EmptyState>
      )}
    </div>
  );
}
