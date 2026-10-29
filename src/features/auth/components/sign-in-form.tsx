"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { applyFieldErrors } from "@/lib/forms";
import { useHydrated } from "@/lib/use-hydrated";
import { notify } from "@/lib/notify";
import { routes } from "@/lib/routes";
import { signIn } from "../actions";
import { signInSchema, type SignInInput } from "../schemas";

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", next },
    mode: "onTouched",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await signIn(values);
      if (!result.ok) {
        applyFieldErrors(form, result);
        notify.error(result.error);
        form.setFocus("password");
        return;
      }
      router.replace(result.data.next);
      router.refresh();
    });
  });

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field error={errors.email?.message}>
        <Label>Email</Label>
        <Input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" {...form.register("email")} />
      </Field>
      <Field error={errors.password?.message}>
        <div className="flex items-baseline justify-between">
          <Label>Password</Label>
          <Link href={routes.forgotPassword} className="text-[14px] font-medium text-accent-ink hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput autoComplete="current-password" enterKeyHint="go" {...form.register("password")} />
      </Field>
      <Button type="submit" size="lg" loading={pending} disabled={!hydrated} className="mt-1 w-full">
        Sign in
      </Button>
    </form>
  );
}
