"use client";

import { Pencil, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { notify } from "@/lib/notify";
import type { ActionResult } from "@/lib/result";
import { savePrompt, saveQuote } from "../actions";

type QuoteValue = { body: string; author: string; source: string };
type PromptValue = { body: string; topicSlug: string };

/** Add or edit a quote. */
export function QuoteDialog({ id, initial }: { id?: string; initial?: QuoteValue }) {
  const [value, setValue] = useState<QuoteValue>(initial ?? { body: "", author: "", source: "" });
  return (
    <EditorDialog
      title={id ? "Edit quote" : "Add a quote"}
      trigger={id ? "edit" : "add"}
      onOpen={() => setValue(initial ?? { body: "", author: "", source: "" })}
      onSave={() => saveQuote(id ?? null, value)}
      canSave={value.body.trim().length >= 5}
    >
      <Field>
        <Label>Quote</Label>
        <Textarea value={value.body} onChange={(e) => setValue({ ...value, body: e.target.value })} maxLength={400} rows={4} className="font-serif text-[18px]" autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label optional>Author</Label>
          <Input value={value.author} onChange={(e) => setValue({ ...value, author: e.target.value })} maxLength={120} />
        </Field>
        <Field>
          <Label optional>Source</Label>
          <Input value={value.source} onChange={(e) => setValue({ ...value, source: e.target.value })} maxLength={160} />
        </Field>
      </div>
      <p className="text-[13px] text-muted">Check the wording and the author against the original source before publishing.</p>
    </EditorDialog>
  );
}

/** Add or edit a journaling prompt. */
export function PromptDialog({ id, initial, topics }: { id?: string; initial?: PromptValue; topics: { slug: string; title: string }[] }) {
  const [value, setValue] = useState<PromptValue>(initial ?? { body: "", topicSlug: "" });
  return (
    <EditorDialog
      title={id ? "Edit prompt" : "Add a prompt"}
      trigger={id ? "edit" : "add"}
      onOpen={() => setValue(initial ?? { body: "", topicSlug: "" })}
      onSave={() => savePrompt(id ?? null, value)}
      canSave={value.body.trim().length >= 5}
    >
      <Field>
        <Label>Prompt</Label>
        <Textarea value={value.body} onChange={(e) => setValue({ ...value, body: e.target.value })} maxLength={280} rows={3} className="font-serif text-[18px]" autoFocus />
      </Field>
      <Field>
        <Label>Where it appears</Label>
        <Select value={value.topicSlug} onChange={(e) => setValue({ ...value, topicSlug: e.target.value })}>
          <option value="">Daily prompt (Today and the journal)</option>
          {topics.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.title} topic
            </option>
          ))}
        </Select>
      </Field>
    </EditorDialog>
  );
}

function EditorDialog({
  title,
  trigger,
  onOpen,
  onSave,
  canSave,
  children,
}: {
  title: string;
  trigger: "add" | "edit";
  onOpen: () => void;
  onSave: () => Promise<ActionResult>;
  canSave: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpen();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        {trigger === "add" ? (
          <Button size="md">
            <Plus aria-hidden />
            {title}
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label={title} className="text-faint hover:text-ink">
            <Pencil />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent title={title} className="sm:max-w-[560px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await onSave();
              if (!result.ok) return void notify.error(result.error);
              notify.success(result.message ?? "Saved");
              setOpen(false);
            });
          }}
          className="flex flex-col gap-5"
        >
          {children}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={!canSave}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
