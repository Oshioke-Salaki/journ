"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { PreferencesInput } from "../schemas";

type WithPreferences = { preferences: PreferencesInput };

/** Consent for goal prompts and reminders. Both start off: JournApp only nudges when asked to. */
export function PreferenceFields<T extends WithPreferences>({ form }: { form: UseFormReturn<T> }) {
  const f = form as unknown as UseFormReturn<WithPreferences>;
  const remindersOn = f.watch("preferences.remindersEnabled");

  return (
    <div className="flex flex-col divide-y divide-rule rounded-[var(--radius-card)] bg-raised">
      <SwitchRow
        id="goal-prompts"
        title="Prompts towards my goals"
        description="On Today, a gentle nudge about the next step of a goal you set."
      >
        <Controller
          control={f.control}
          name="preferences.goalPromptsEnabled"
          render={({ field }) => <Switch id="goal-prompts" checked={field.value} onCheckedChange={field.onChange} />}
        />
      </SwitchRow>
      <SwitchRow id="reminders" title="A daily check-in reminder" description="One reminder a day, at a time you choose.">
        <Controller
          control={f.control}
          name="preferences.remindersEnabled"
          render={({ field }) => <Switch id="reminders" checked={field.value} onCheckedChange={field.onChange} />}
        />
      </SwitchRow>
      {remindersOn ? (
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <label htmlFor="reminder-time" className="text-[15px] text-ink">
            Remind me at
          </label>
          <Input id="reminder-time" type="time" className="h-10 w-[130px]" {...f.register("preferences.reminderTime")} />
        </div>
      ) : null}
    </div>
  );
}

function SwitchRow({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <label htmlFor={id} className="flex cursor-pointer flex-col gap-0.5">
        <span className="text-[15px] font-medium text-ink">{title}</span>
        <span className="text-[14px] text-muted">{description}</span>
      </label>
      {children}
    </div>
  );
}
