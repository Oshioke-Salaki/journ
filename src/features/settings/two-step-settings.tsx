"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/dialog";
import { Description, Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { confirmTotp, removeTotp, startTotp } from "@/features/auth/mfa-actions";
import { formatDate } from "@/lib/dates";
import { notify, toastResult } from "@/lib/notify";

type Setup = { factorId: string; qr: string; secret: string };

/** Two-step sign-in with an authenticator app (Google Authenticator, 1Password, Authy...). */
export function TwoStepSettings({ factor, recommended }: { factor: { id: string; createdAt: string } | null; recommended: boolean }) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  if (factor) return <TwoStepOn factor={factor} />;

  if (!setup) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-[15px] text-ink">
          After your password, JournApp also asks for a code from an authenticator app on your phone. Someone who learns your password still can&rsquo;t get in.
          {recommended ? " Strongly recommended for admins." : ""}
        </p>
        <Button
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await startTotp();
              if (!result.ok) return void notify.error(result.error);
              setSetup(result.data);
            })
          }
        >
          <ShieldCheck aria-hidden />
          Set up two-step sign-in
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = toastResult(await confirmTotp(setup.factorId, code));
          if (!result.ok) setError(result.fieldErrors?.code?.[0] ?? result.error);
        });
      }}
      className="flex flex-col gap-5"
    >
      <ol className="flex flex-col gap-2 text-[15px] text-ink [&>li]:ml-5 [&>li]:list-decimal">
        <li>Open an authenticator app, such as Google Authenticator, Microsoft Authenticator or 1Password.</li>
        <li>Scan this code, or type in the key below it.</li>
        <li>Enter the 6-digit code the app shows.</li>
      </ol>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
        {/* The QR code is an SVG data URI from Supabase; it must stay dark on white to scan. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={setup.qr} alt="QR code for your authenticator app" width={168} height={168} className="rounded-[12px] bg-white p-2" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[13px] text-muted">Or type this key</p>
          <code className="num text-[15px] break-all text-ink select-all">{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</code>
        </div>
      </div>
      <Field error={error}>
        <Label>Code from the app</Label>
        <Description>It changes every 30 seconds.</Description>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ""));
            setError(undefined);
          }}
          className="num max-w-[200px] tracking-[0.3em]"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setSetup(null)} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending} disabled={code.length !== 6}>
          Turn on
        </Button>
      </div>
    </form>
  );
}

function TwoStepOn({ factor }: { factor: { id: string; createdAt: string } }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
          <ShieldCheck className="size-4 text-accent-ink" aria-hidden />
          On
        </p>
        <p className="text-[14px] text-muted">Set up {formatDate(factor.createdAt.slice(0, 10), { day: "numeric", month: "long", year: "numeric" })}. Signing in asks for a code from your app.</p>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <ShieldOff aria-hidden />
            Turn off
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent title="Turn off two-step sign-in?" description="Your password alone will be enough to sign in. You can set it up again at any time.">
          <AlertDialogCancel asChild>
            <Button variant="secondary">Keep it on</Button>
          </AlertDialogCancel>
          <Button
            variant="danger-solid"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                const result = toastResult(await removeTotp(factor.id));
                if (result.ok) setOpen(false);
              })
            }
          >
            Turn off
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
