"use client";

import { ShieldOff, UserMinus, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify, toastResult } from "@/lib/notify";
import { resetTwoStep, setAdmin } from "../actions";

export function AddAdminForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await setAdmin(email, true);
          if (!result.ok) {
            setError(result.fieldErrors?.email?.[0] ?? result.error);
            return void notify.error(result.error);
          }
          notify.success("Admin added", `${email} can now open the admin area.`);
          setEmail("");
          setError(undefined);
        });
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      noValidate
    >
      <Field error={error} className="flex-1">
        <Label>Add an admin by email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="off" />
      </Field>
      <Button type="submit" loading={pending} disabled={!email.trim()} className="h-12 sm:mb-0">
        <UserPlus aria-hidden />
        Add admin
      </Button>
    </form>
  );
}

export function RemoveAdminButton({ email, isYou }: { email: string; isYou: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  if (isYou) return <span className="text-[13px] text-muted">You</span>;
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-negative hover:bg-negative-soft">
          <UserMinus aria-hidden />
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent title={`Remove ${email} as an admin?`} description="They keep their JournApp account and journal, but lose access to the admin area.">
        <AlertDialogCancel asChild>
          <Button variant="secondary">Keep as admin</Button>
        </AlertDialogCancel>
        <Button
          variant="danger-solid"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result = toastResult(await setAdmin(email, false));
              if (result.ok) setOpen(false);
            })
          }
        >
          Remove admin
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ResetTwoStepForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await resetTwoStep(email);
          if (!result.ok) {
            setError(result.fieldErrors?.email?.[0]);
            return void notify.error(result.error);
          }
          notify.success("Two-step sign-in reset", `${email} can now sign in with their password and set it up again.`);
          setEmail("");
          setError(undefined);
        });
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      noValidate
    >
      <Field error={error} className="flex-1">
        <Label>Member&rsquo;s email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="off" />
      </Field>
      <Button type="submit" variant="outline" loading={pending} disabled={!email.trim()} className="h-12">
        <ShieldOff aria-hidden />
        Reset
      </Button>
    </form>
  );
}
