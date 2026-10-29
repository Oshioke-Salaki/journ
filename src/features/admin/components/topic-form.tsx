"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toastResult } from "@/lib/notify";
import { saveTopic } from "../actions";

export function TopicForm({ slug, initial }: { slug: string; initial: { title: string; summary: string; isMature: boolean } }) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const dirty = value.title !== initial.title || value.summary !== initial.summary || value.isMature !== initial.isMature;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => void toastResult(await saveTopic(slug, value)));
      }}
      className="flex flex-col gap-4"
    >
      <Field>
        <Label>Title</Label>
        <Input value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} maxLength={60} />
      </Field>
      <Field>
        <Label>Summary</Label>
        <Textarea value={value.summary} onChange={(e) => setValue({ ...value, summary: e.target.value })} maxLength={400} rows={3} />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3 text-[14px] text-ink">
          <Switch checked={value.isMature} onCheckedChange={(v) => setValue({ ...value, isMature: v })} aria-label="Adults only (18+)" />
          Adults only (18+)
        </label>
        <Button type="submit" size="sm" loading={pending} disabled={!dirty}>
          Save topic
        </Button>
      </div>
    </form>
  );
}
