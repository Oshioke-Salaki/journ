"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/dialog";
import { notify } from "@/lib/notify";
import { routes } from "@/lib/routes";
import { deleteEntry } from "../actions";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await deleteEntry(entryId);
      if (!result.ok) return void notify.error(result.error);
      setOpen(false);
      notify.success("Entry deleted");
      router.replace(routes.journal);
    });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-negative hover:bg-negative-soft">
          <Trash2 aria-hidden />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent title="Delete this entry?" description="It will be removed from your journal for good. This can't be undone.">
        <AlertDialogCancel asChild>
          <Button variant="secondary">Keep it</Button>
        </AlertDialogCancel>
        <Button variant="danger-solid" onClick={confirm} loading={pending}>
          Delete entry
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}
