"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Landscape } from "@/components/brand/landscape";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { completeOnboarding } from "@/features/profile/actions";
import { AboutYouFields } from "@/features/profile/components/about-you-fields";
import { PreferenceFields } from "@/features/profile/components/preference-fields";
import { onboardingSchema, type OnboardingInput } from "@/features/profile/schemas";
import { applyFieldErrors } from "@/lib/forms";
import { notify } from "@/lib/notify";

const STEPS = [
  { title: "What should we call you?", body: "This is how JournApp will greet you each day." },
  {
    title: "A little about you",
    body: "All optional, and only ever visible to you. Skip anything you'd rather not share.",
  },
  { title: "How JournApp supports you", body: "Nothing nudges you unless you ask it to. You can change these any time in Settings." },
] as const;

export function OnboardingFlow({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pending, startTransition] = useTransition();

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: defaultName,
      about: { dateOfBirth: "", birthTime: "", birthPlace: "", birthLocation: null, country: "", pronouns: "", language: "en" },
      preferences: { goalPromptsEnabled: true, remindersEnabled: false, reminderTime: "20:00" },
    },
    mode: "onTouched",
  });

  const go = async (to: number) => {
    if (to > step) {
      const fields = step === 0 ? (["name"] as const) : step === 1 ? (["about"] as const) : (["preferences"] as const);
      if (!(await form.trigger(fields, { shouldFocus: true }))) return;
    }
    setDirection(to > step ? 1 : -1);
    setStep(to);
  };

  const finish = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await completeOnboarding({ ...values, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      if (!result.ok) {
        applyFieldErrors(form, result);
        notify.error(result.error);
        if (result.fieldErrors?.name) setStep(0);
        else if (Object.keys(result.fieldErrors ?? {}).some((k) => k.startsWith("about"))) setStep(1);
        return;
      }
      notify.success(`Welcome, ${values.name.split(" ")[0]}`, "Your journal is ready.");
      router.replace(result.data.next);
    });
  });

  const current = STEPS[step];
  const offset = reduce ? 0 : 28;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step < STEPS.length - 1) void go(step + 1);
        else void finish();
      }}
      noValidate
      className="flex w-full flex-col"
    >
      <div className="mb-8 flex items-center gap-3">
        {step > 0 ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => go(step - 1)} aria-label="Back" className="-ml-2">
            <ArrowLeft />
          </Button>
        ) : null}
        <div className="flex flex-1 gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`} role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
          {STEPS.map((_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-active">
              <motion.span
                className="block h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -offset }}
          transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col"
        >
          <h1 className="text-[28px] leading-[1.15] font-semibold tracking-[-0.02em] text-ink sm:text-[32px]">{current.title}</h1>
          <p className="mt-2 mb-8 text-[16px] text-muted">{current.body}</p>

          {step === 0 ? (
            <div className="flex flex-col gap-8">
              <Field error={form.formState.errors.name?.message}>
                <Label>Your first name</Label>
                <Input autoComplete="given-name" autoCapitalize="words" autoFocus {...form.register("name")} />
              </Field>
              <Landscape mood={4} energy={3} seed={3} className="rounded-[20px]" />
            </div>
          ) : null}
          {step === 1 ? <AboutYouFields form={form} /> : null}
          {step === 2 ? (
            <div className="flex flex-col gap-5">
              <PreferenceFields form={form} />
              <p className="text-[14px] text-muted">
                Your journal, check-ins and details are private to you. We never sell your data or show it to anyone else.
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {step === 1 ? (
          <Button type="button" variant="ghost" onClick={() => go(2)}>
            Skip for now
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto sm:min-w-40">
          {step < STEPS.length - 1 ? "Continue" : "Start my journal"}
        </Button>
      </div>
    </form>
  );
}
