"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { removeLock } from "@/lib/app-lock";
import { notify } from "@/lib/notify";
import { useHydrated } from "@/lib/use-hydrated";
import { signOut } from "../actions";
import { verifySignIn } from "../mfa-actions";

export function VerifyForm({ next }: { next?: string }) {
  const hydrated = useHydrated();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [leaving, startLeaving] = useTransition();

  return (
    <form
      method="post"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await verifySignIn(code, next);
          if (!result.ok) {
            setError(result.fieldErrors?.code?.[0] ?? result.error);
            notify.error(result.error);
            setCode("");
            return;
          }
          // A full load, so every part of the app reads the upgraded session.
          window.location.assign(result.data.next);
        });
      }}
      className="flex flex-col gap-5"
    >
      <Field error={error}>
        <Label>6-digit code</Label>
        <Input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ""));
            setError(undefined);
          }}
          className="num text-center text-[22px] tracking-[0.4em]"
        />
      </Field>
      <Button type="submit" size="lg" loading={pending} disabled={!hydrated || code.length !== 6 || leaving} className="w-full">
        Continue
      </Button>
      <Button
        type="button"
        variant="link"
        className="self-center"
        loading={leaving}
        disabled={pending}
        onClick={() =>
          startLeaving(async () => {
            await signOut();
            removeLock();
            window.location.assign("/sign-in");
          })
        }
      >
        Use a different account
      </Button>
    </form>
  );
}
