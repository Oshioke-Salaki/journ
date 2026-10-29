"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toastResult } from "@/lib/notify";
import { deleteContent, setActive } from "../actions";

type Table = "quotes" | "prompts" | "videos";

export function LiveSwitch({ table, id, active, label }: { table: Table; id: string; active: boolean; label: string }) {
  const [on, setOn] = useState(active);
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={on}
      disabled={pending}
      aria-label={`${label}: ${on ? "live" : "hidden"}`}
      onCheckedChange={(next) => {
        setOn(next);
        startTransition(async () => {
          const result = toastResult(await setActive(table, id, next));
          if (!result.ok) setOn(!next);
        });
      }}
    />
  );
}

export function DeleteButton({ table, id, label }: { table: Table; id: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${label}`} className="text-faint hover:text-negative">
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent title="Delete this for everyone?" description={`“${label}” will be removed from JournApp for every member. To keep it but hide it, switch it off instead.`}>
        <AlertDialogCancel asChild>
          <Button variant="secondary">Keep it</Button>
        </AlertDialogCancel>
        <Button
          variant="danger-solid"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result = toastResult(await deleteContent(table, id));
              if (result.ok) setOpen(false);
            })
          }
        >
          Delete
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}
