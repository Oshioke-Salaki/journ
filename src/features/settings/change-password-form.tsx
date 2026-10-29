"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Description, Field, Label } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword } from "@/features/auth/actions";
import { changePasswordSchema, PASSWORD_RULES, type ChangePasswordInput } from "@/features/auth/schemas";
import { applyFieldErrors } from "@/lib/forms";
import { toastResult } from "@/lib/notify";

const EMPTY: ChangePasswordInput = { current: "", password: "", confirm: "" };

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: EMPTY, mode: "onTouched" });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = toastResult(await changePassword(values));
      if (!result.ok) return applyFieldErrors(form, result);
      form.reset(EMPTY);
    }),
  );

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field error={errors.current?.message}>
        <Label>Current password</Label>
        <PasswordInput autoComplete="current-password" {...form.register("current")} />
      </Field>
      <Field error={errors.password?.message}>
        <Label>New password</Label>
        <Description>{PASSWORD_RULES}</Description>
        <PasswordInput autoComplete="new-password" described {...form.register("password")} />
      </Field>
      <Field error={errors.confirm?.message}>
        <Label>Repeat new password</Label>
        <PasswordInput autoComplete="new-password" {...form.register("confirm")} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={!form.formState.isDirty}>
          Change password
        </Button>
      </div>
    </form>
  );
}
