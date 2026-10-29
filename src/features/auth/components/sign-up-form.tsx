"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Description, Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { applyFieldErrors } from "@/lib/forms";
import { useHydrated } from "@/lib/use-hydrated";
import { notify } from "@/lib/notify";
import { routes } from "@/lib/routes";
import { useOnReveal } from "@/lib/use-on-reveal";
import { signUp } from "../actions";
import { PASSWORD_RULES, signUpSchema, type SignUpInput } from "../schemas";

export function SignUpForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", acceptTerms: false as unknown as true },
    mode: "onTouched",
  });
  const { errors } = form.formState;
  useOnReveal(() => setSentTo(null));

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await signUp({ ...values, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      if (!result.ok) {
        applyFieldErrors(form, result);
        notify.error(result.error);
        return;
      }
      if ("confirmEmail" in result.data) {
        setSentTo(values.email);
        return;
      }
      router.replace(result.data.next);
    });
  });

  if (sentTo) {
    return (
      <div className="flex flex-col items-start gap-4" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Check your email</h2>
        <p className="text-[16px] text-muted">
          We sent a link to <span className="font-medium text-ink">{sentTo}</span>. Open it on this device to confirm your
          account and start your journal.
        </p>
        <Button variant="ghost" className="-ml-5" onClick={() => setSentTo(null)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field error={errors.name?.message}>
        <Label>Your first name</Label>
        <Input autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" {...form.register("name")} />
      </Field>
      <Field error={errors.email?.message}>
        <Label>Email</Label>
        <Input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" {...form.register("email")} />
      </Field>
      <Field error={errors.password?.message}>
        <Label>Password</Label>
        <Description>{PASSWORD_RULES}</Description>
        <PasswordInput autoComplete="new-password" described enterKeyHint="go" {...form.register("password")} />
      </Field>
      <Field error={errors.acceptTerms?.message}>
        <div className="flex items-start gap-3">
          <Controller
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <Checkbox
                id="accept-terms"
                checked={field.value === true}
                onCheckedChange={(v) => field.onChange(v === true)}
                aria-invalid={errors.acceptTerms ? true : undefined}
                className="mt-0.5"
              />
            )}
          />
          <label htmlFor="accept-terms" className="text-[14px] leading-snug text-muted">
            I agree to the{" "}
            <Link href={routes.terms} className="font-medium text-ink underline underline-offset-2" target="_blank">
              terms
            </Link>{" "}
            and{" "}
            <Link href={routes.privacy} className="font-medium text-ink underline underline-offset-2" target="_blank">
              privacy policy
            </Link>
            , including how JournApp stores my journal and wellbeing data.
          </label>
        </div>
      </Field>
      <Button type="submit" size="lg" loading={pending} disabled={!hydrated} className="mt-1 w-full">
        Create account
      </Button>
    </form>
  );
}
