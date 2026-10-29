"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { updatePreferences } from "@/features/profile/actions";
import { PreferenceFields } from "@/features/profile/components/preference-fields";
import { preferencesSchema, type PreferencesInput } from "@/features/profile/schemas";
import { toastResult } from "@/lib/notify";

export function PreferencesForm({ defaults }: { defaults: PreferencesInput }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<{ preferences: PreferencesInput }>({
    resolver: zodResolver(z.object({ preferences: preferencesSchema })),
    defaultValues: { preferences: defaults },
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = toastResult(await updatePreferences(values.preferences));
      if (result.ok) form.reset(values);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <PreferenceFields form={form} />
      <p className="text-[13px] text-muted">Reminders are delivered by email once we launch notifications. Your choice is saved now.</p>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={!form.formState.isDirty}>
          Save preferences
        </Button>
      </div>
    </form>
  );
}
