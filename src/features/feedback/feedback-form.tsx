"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Chips } from "@/components/ui/chips";
import { Description, Field, Label } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { applyFieldErrors } from "@/lib/forms";
import { toastResult } from "@/lib/notify";
import { useHydrated } from "@/lib/use-hydrated";
import { sendFeedback } from "./actions";
import { FEEDBACK_KINDS, feedbackSchema, type FeedbackInput } from "./schemas";

export function FeedbackForm() {
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const form = useForm<FeedbackInput>({ resolver: zodResolver(feedbackSchema), defaultValues: { kind: "idea", body: "" } });
  const kind = form.watch("kind");

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = toastResult(await sendFeedback({ ...values, device: values.kind === "problem" ? navigator.userAgent.slice(0, 200) : null }));
      if (result.ok) form.reset({ kind: values.kind, body: "" });
      else applyFieldErrors(form, result);
    }),
  );

  return (
    <form onSubmit={onSubmit} method="post" noValidate className="flex flex-col gap-4">
      <Controller
        control={form.control}
        name="kind"
        render={({ field }) => <Chips single label="What is it about?" options={FEEDBACK_KINDS} value={[field.value]} onChange={(v) => v[0] && field.onChange(v[0])} />}
      />
      <Field error={form.formState.errors.body?.message}>
        <Label>Your message</Label>
        <Description>{kind === "problem" ? "What happened, and what did you expect? Your browser type is sent with it." : "Only the JournApp team reads this."}</Description>
        <Textarea rows={4} maxLength={2000} placeholder={kind === "idea" ? "It would help me if JournApp could…" : undefined} {...form.register("body")} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={!hydrated}>
          <Send aria-hidden />
          Send
        </Button>
      </div>
    </form>
  );
}
