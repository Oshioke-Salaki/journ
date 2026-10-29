"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyFieldErrors } from "@/lib/forms";
import { notify } from "@/lib/notify";
import { routes } from "@/lib/routes";
import { useOnReveal } from "@/lib/use-on-reveal";
import { createGoal } from "../actions";
import { goalSchema, type GoalInput } from "../schemas";
import { GoalFields } from "./goal-fields";

const EMPTY: GoalInput = { title: "", why: "", area: "growth", targetDate: "", steps: [{ title: "", dueDate: "" }] };

export function GoalForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<GoalInput>({ resolver: zodResolver(goalSchema), defaultValues: EMPTY, mode: "onTouched" });
  useOnReveal(() => form.reset(EMPTY));
  const steps = useFieldArray({ control: form.control, name: "steps" });

  const onSubmit = form.handleSubmit(
    (values) =>
      startTransition(async () => {
        const result = await createGoal(values);
        if (!result.ok) {
          applyFieldErrors(form, result);
          return void notify.error(result.error);
        }
        notify.success("Goal set", "Small steps count. Tick them off as you go.");
        router.replace(routes.goal(result.data.id));
      }),
    () => notify.error("Check the highlighted fields."),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-10">
      <GoalFields form={form} />

      <section aria-labelledby="steps-heading" className="flex flex-col gap-3">
        <div>
          <h2 id="steps-heading" className="text-[17px] font-semibold text-ink">
            First steps
          </h2>
          <p className="text-[14px] text-muted">Break it into steps you could start this week. Give a step a date to see it in My plans.</p>
        </div>
        <ul className="flex flex-col gap-2">
          {steps.fields.map((field, i) => (
            <li key={field.id} className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_170px]">
                {form.formState.errors.steps?.[i]?.title ? (
                  <p className="text-[13px] font-medium text-negative sm:col-span-2" role="alert">
                    {form.formState.errors.steps[i]?.title?.message}
                  </p>
                ) : null}
                <Input
                  aria-label={`Step ${i + 1}`}
                  placeholder={i === 0 ? "Lay out walking shoes the night before" : "Another step"}
                  {...form.register(`steps.${i}.title`)}
                  aria-invalid={form.formState.errors.steps?.[i]?.title ? true : undefined}
                />
                <Input type="date" aria-label={`Date for step ${i + 1}`} {...form.register(`steps.${i}.dueDate`)} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => steps.remove(i)} aria-label={`Remove step ${i + 1}`} disabled={steps.fields.length === 1}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => steps.append({ title: "", dueDate: "" })}
          disabled={steps.fields.length >= 30}
        >
          <Plus aria-hidden />
          Add a step
        </Button>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" size="lg" loading={pending}>
          Set goal
        </Button>
      </div>
    </form>
  );
}
