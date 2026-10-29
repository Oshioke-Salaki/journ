"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Chips } from "@/components/ui/chips";
import { Field, Label } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { GOAL_AREAS } from "../constants";
import type { GoalUpdateInput } from "../schemas";

/** Title, why, area and target date: shared by "Set a goal" and "Edit goal". */
export function GoalFields<T extends GoalUpdateInput>({ form }: { form: UseFormReturn<T> }) {
  const f = form as unknown as UseFormReturn<GoalUpdateInput>;
  const { errors } = f.formState;
  return (
    <div className="flex flex-col gap-6">
      <Field error={errors.title?.message}>
        <Label>What do you want to achieve?</Label>
        <Input placeholder="Walk every morning before work" autoComplete="off" {...f.register("title")} />
      </Field>
      <Field error={errors.why?.message}>
        <Label optional>Why does it matter to you?</Label>
        <Textarea rows={3} placeholder="I think more clearly on days I move first." {...f.register("why")} />
      </Field>
      <div className="flex flex-col gap-2.5">
        <p className="text-[14px] font-medium text-ink">Area of life</p>
        <Controller
          control={f.control}
          name="area"
          render={({ field }) => (
            <Chips
              single
              label="Area of life"
              options={GOAL_AREAS}
              value={field.value ? [field.value] : []}
              onChange={(v) => field.onChange(v[0] ?? "growth")}
            />
          )}
        />
      </div>
      <Field error={errors.targetDate?.message} className="sm:max-w-[240px]">
        <Label optional>Target date</Label>
        <Input type="date" {...f.register("targetDate")} />
      </Field>
    </div>
  );
}
