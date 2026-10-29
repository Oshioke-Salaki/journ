import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EditorSkeleton } from "@/features/journal/components/editor-skeleton";
import { EntryEditor } from "@/features/journal/components/entry-editor";
import { getEntry } from "@/features/journal/queries";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit entry" };

export default function EditEntryPage({ params }: PageProps<"/journal/[id]/edit">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditEntry params={params} />
    </Suspense>
  );
}

async function EditEntry({ params }: Pick<PageProps<"/journal/[id]/edit">, "params">) {
  const [{ id }, { user }] = await Promise.all([params, requireMember()]);
  const entry = /^[0-9a-f-]{36}$/i.test(id) ? await getEntry(id) : null;
  if (!entry) notFound();
  return (
    <EntryEditor mode="edit" userId={user.id} entryId={entry.id} initial={{ title: entry.title ?? "", body: entry.body }} promptBody={entry.prompt_body} />
  );
}
