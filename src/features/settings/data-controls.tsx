"use client";

import { Download, LogOut, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { signOut } from "@/features/auth/actions";
import { clearAllDrafts } from "@/features/journal/components/use-draft";
import { notify } from "@/lib/notify";
import { deleteAccount, exportMyData } from "./actions";

export function DownloadDataButton() {
  const [pending, startTransition] = useTransition();
  const download = () =>
    startTransition(async () => {
      const result = await exportMyData();
      if (!result.ok) return void notify.error(result.error);
      const url = URL.createObjectURL(new Blob([result.data.json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      notify.success("Your data is downloading", result.data.filename);
    });
  return (
    <Button variant="outline" onClick={download} loading={pending}>
      <Download aria-hidden />
      Download my data
    </Button>
  );
}

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await signOut();
          if (!result.ok) return void notify.error(result.error);
          clearAllDrafts();
          window.location.assign(result.data.next);
        })
      }
    >
      <LogOut aria-hidden />
      Sign out
    </Button>
  );
}

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [pending, startTransition] = useTransition();
  const ready = word.trim().toUpperCase() === "DELETE";

  const confirm = () =>
    startTransition(async () => {
      const result = await deleteAccount(word);
      if (!result.ok) return void notify.error(result.error);
      clearAllDrafts();
      window.location.assign(result.data.next);
    });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setWord("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="danger">
          <Trash2 aria-hidden />
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        title="Delete your account?"
        description="Your journal, check-ins, goals and profile will be erased for good. Download your data first if you want a copy. This can't be undone."
      >
        <div className="flex w-full flex-col gap-4">
          <label className="flex flex-col gap-2 text-[14px] font-medium text-ink">
            Type DELETE to confirm
            <Input value={word} onChange={(e) => setWord(e.target.value)} autoCapitalize="characters" autoComplete="off" spellCheck={false} />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel asChild>
              <Button variant="secondary">Keep my account</Button>
            </AlertDialogCancel>
            <Button variant="danger-solid" onClick={confirm} disabled={!ready} loading={pending}>
              Delete everything
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
