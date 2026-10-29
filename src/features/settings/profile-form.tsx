"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/features/profile/actions";
import { AboutYouFields } from "@/features/profile/components/about-you-fields";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/features/profile/schemas";
import { applyFieldErrors } from "@/lib/forms";
import { toastResult } from "@/lib/notify";

export function ProfileForm({ defaults }: { defaults: ProfileUpdateInput }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileUpdateInput>({ resolver: zodResolver(profileUpdateSchema), defaultValues: defaults, mode: "onTouched" });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = toastResult(await updateProfile(values));
      if (!result.ok) return applyFieldErrors(form, result);
      form.reset(values);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Field error={form.formState.errors.name?.message}>
        <Label>First name</Label>
        <Input autoComplete="given-name" {...form.register("name")} />
      </Field>
      <AboutYouFields form={form} />
      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={!form.formState.isDirty}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
