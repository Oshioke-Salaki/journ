"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { applyFieldErrors } from "@/lib/forms";
import { useHydrated } from "@/lib/use-hydrated";
import { notify } from "@/lib/notify";
import { requestPasswordReset } from "../actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (!result.ok) {
        applyFieldErrors(form, result);
        notify.error(result.error);
        return;
      }
      setSentTo(values.email);
    });
  });

  if (sentTo) {
    return (
      <div className="flex flex-col items-start gap-4" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <p className="text-[16px] text-muted">
          If there is an account for <span className="font-medium text-ink">{sentTo}</span>, a link to choose a new password
          is on its way. It works for one hour.
        </p>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field error={form.formState.errors.email?.message}>
        <Label>Email</Label>
        <Input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} {...form.register("email")} />
      </Field>
      <Button type="submit" size="lg" loading={pending} disabled={!hydrated} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
