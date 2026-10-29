import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteButton, LiveSwitch } from "@/features/admin/components/row-actions";
import { PromptDialog } from "@/features/admin/components/text-editor-dialog";
import { adminPrompts, adminTopics } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { AdminHeader } from "../admin-header";

export const metadata: Metadata = { title: "Prompts" };

export default function AdminPromptsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] rounded-[18px]" />}>
      <Prompts />
    </Suspense>
  );
}

async function Prompts() {
  await requireAdmin();
  const [prompts, topics] = await Promise.all([adminPrompts(), adminTopics()]);
  const titles = new Map(topics.map((t) => [t.slug, t.title]));
  const list = topics.map((t) => ({ slug: t.slug, title: t.title }));
  return (
    <>
      <AdminHeader title="Prompts" description="Daily prompts rotate on Today; topic prompts appear on each Community topic." action={<PromptDialog topics={list} />} />
      <div className="overflow-hidden rounded-[18px] border border-border">
        <p className="num border-b border-rule px-5 py-3 text-[14px] text-muted">
          {prompts.length} prompts · {prompts.filter((p) => p.is_active).length} live
        </p>
        {prompts.length === 0 ? (
        <p className="px-5 py-8 text-[15px] text-muted">No prompts yet. Add a daily prompt or a prompt for one of the Community topics.</p>
      ) : null}
      <ul className="divide-y divide-rule">
          {prompts.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[17px] leading-snug text-ink">{p.body}</p>
                <p className="text-[13px] text-muted">{p.topic_slug ? `${titles.get(p.topic_slug)} topic` : "Daily prompt"}</p>
              </div>
              <PromptDialog id={p.id} initial={{ body: p.body, topicSlug: p.topic_slug ?? "" }} topics={list} />
              <LiveSwitch table="prompts" id={p.id} active={p.is_active} label={p.body.slice(0, 40)} />
              <DeleteButton table="prompts" id={p.id} label={p.body.slice(0, 60)} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
