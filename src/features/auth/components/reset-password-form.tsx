"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Description, Field, Label } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { applyFieldErrors } from "@/lib/forms";
import { toastResult } from "@/lib/notify";
import { useHydrated } from "@/lib/use-hydrated";
import { updatePassword } from "../actions";
import { PASSWORD_RULES, resetPasswordSchema, type ResetPasswordInput } from "../schemas";

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
    mode: "onTouched",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = toastResult(await updatePassword(values));
      if (!result.ok) {
        applyFieldErrors(form, result);
        return;
      }
      router.replace(result.data.next);
    });
  });

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field error={errors.password?.message}>
        <Label>New password</Label>
        <Description>{PASSWORD_RULES}</Description>
        <PasswordInput autoComplete="new-password" described {...form.register("password")} />
      </Field>
      <Field error={errors.confirm?.message}>
        <Label>Repeat new password</Label>
        <PasswordInput autoComplete="new-password" {...form.register("confirm")} />
      </Field>
      <Button type="submit" size="lg" loading={pending} disabled={!hydrated} className="w-full">
        Save new password
      </Button>
    </form>
  );
}
