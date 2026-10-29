import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TopicForm } from "@/features/admin/components/topic-form";
import { adminTopics } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { AdminHeader } from "../admin-header";

export const metadata: Metadata = { title: "Topics" };

export default function AdminTopicsPage() {
  return (
    <>
      <AdminHeader title="Topics" description="The six areas of Community. Their names and introductions appear on the welcome page too." />
      <Suspense fallback={<Skeleton className="h-[420px] rounded-[18px]" />}>
        <Topics />
      </Suspense>
    </>
  );
}

async function Topics() {
  await requireAdmin();
  const topics = await adminTopics();
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {topics.map((t) => (
        <li key={t.slug} className="rounded-[18px] border border-border p-5">
          <TopicForm slug={t.slug} initial={{ title: t.title, summary: t.summary, isMature: t.is_mature }} />
        </li>
      ))}
    </ul>
  );
}
