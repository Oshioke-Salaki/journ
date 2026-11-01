"use client";

import { Lock, LockOpen } from "lucide-react";
import { useState, useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Chips } from "@/components/ui/chips";
import { Description, Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { checkCode, CODE_PATTERN, LOCK_AFTER, lockSnapshot, removeLock, setLock, setLockMinutes, subscribeLock, type LockConfig } from "@/lib/app-lock";
import { notify } from "@/lib/notify";
import { useHydrated } from "@/lib/use-hydrated";

const AFTER_OPTIONS = LOCK_AFTER.map((o) => ({ value: String(o.value), label: o.label }));

/** Turn the app lock on or off on this device, and choose how soon it locks. */
export function AppLockSettings() {
  const hydrated = useHydrated();
  const raw = useSyncExternalStore(subscribeLock, lockSnapshot, () => null);
  const config = raw ? (JSON.parse(raw) as LockConfig) : null;
  if (!hydrated) return <div className="h-[220px]" aria-hidden />;
  return config ? <LockOn minutes={config.minutes} /> : <LockOff />;
}

function LockOff() {
  const [code, setCode] = useState("");
  const [again, setAgain] = useState("");
  const [minutes, setMinutes] = useState("1");
  const [errors, setErrors] = useState<{ code?: string; again?: string }>({});
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const next: typeof errors = {};
    if (!CODE_PATTERN.test(code)) next.code = "Use 4 to 6 numbers.";
    else if (code !== again) next.again = "The codes don't match.";
    setErrors(next);
    if (next.code || next.again) return;
    startTransition(async () => {
      try {
        await setLock(code, Number(minutes));
        notify.success("App lock is on", "JournApp will ask for your code on this device.");
      } catch {
        notify.error("This browser can't set an app lock.");
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      <p className="text-[15px] text-ink">Ask for a code when JournApp opens on this device. Useful on a shared phone or tablet.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.code}>
          <Label>New code</Label>
          <Input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field error={errors.again}>
          <Label>Type it again</Label>
          <Input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={again} onChange={(e) => setAgain(e.target.value.replace(/\D/g, ""))} />
        </Field>
      </div>
      <Field>
        <Label>Lock again</Label>
        <Description>When JournApp has been closed or in the background for this long.</Description>
        <Chips single label="Lock again" options={AFTER_OPTIONS} value={[minutes]} onChange={(v) => v[0] && setMinutes(v[0])} />
      </Field>
      <p className="text-[13px] text-muted">The code stays on this device. If you forget it, sign out and back in with your password.</p>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={code.length < 4}>
          <Lock aria-hidden />
          Turn on app lock
        </Button>
      </div>
    </form>
  );
}

function LockOn({ minutes }: { minutes: number }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const turnOff = () =>
    startTransition(async () => {
      if (!(await checkCode(code))) {
        setError("That code isn't right.");
        return;
      }
      removeLock();
      notify.success("App lock is off");
    });

  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
        <Lock className="size-4 text-accent-ink" aria-hidden />
        On for this device
      </p>
      <Field>
        <Label>Lock again</Label>
        <Chips
          single
          label="Lock again"
          options={AFTER_OPTIONS}
          value={[String(minutes)]}
          onChange={(v) => {
            if (!v[0]) return;
            setLockMinutes(Number(v[0]));
            notify.success("Saved");
          }}
        />
      </Field>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          turnOff();
        }}
        noValidate
        className="flex flex-col gap-3 border-t border-rule pt-5 sm:flex-row sm:items-end"
      >
        <Field error={error} className="flex-1">
          <Label>Current code</Label>
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setError(undefined);
            }}
          />
        </Field>
        <Button type="submit" variant="outline" loading={pending} disabled={code.length < 4} className="h-12">
          <LockOpen aria-hidden />
          Turn off
        </Button>
      </form>
    </div>
  );
}
