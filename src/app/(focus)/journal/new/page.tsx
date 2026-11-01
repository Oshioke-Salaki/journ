import type { Metadata } from "next";
import { Suspense } from "react";
import { getPromptForDay, getPrompts } from "@/features/content/queries";
import { EditorSkeleton } from "@/features/journal/components/editor-skeleton";
import { EntryEditor } from "@/features/journal/components/entry-editor";
import { listTags } from "@/features/journal/queries";
import { WRITING_STARTS } from "@/features/today/suggestions";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New entry" };

export default function NewEntryPage({ searchParams }: PageProps<"/journal/new">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <NewEntry searchParams={searchParams} />
    </Suspense>
  );
}

async function NewEntry({ searchParams }: Pick<PageProps<"/journal/new">, "searchParams">) {
  const [{ user, today }, params, prompts, tags] = await Promise.all([requireMember(), searchParams, getPrompts(), listTags()]);
  const wanted = typeof params.prompt === "string" ? params.prompt : null;
  const daily = params.prompt === "today" ? await getPromptForDay(today) : null;
  const initialPromptId = daily?.id ?? (prompts.some((p) => p.id === wanted) ? wanted : null);
  const placeholder = typeof params.from === "string" && Object.hasOwn(WRITING_STARTS, params.from) ? WRITING_STARTS[params.from] : undefined;

  return (
    <EntryEditor
      mode="new"
      userId={user.id}
      knownTags={tags.map((t) => t.tag)}
      prompts={prompts.map((p) => ({ id: p.id, body: p.body }))}
      initialPromptId={initialPromptId}
      placeholder={placeholder}
    />
  );
}
