"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pause, Pencil, Play, Trash2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger, Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { applyFieldErrors } from "@/lib/forms";
import { notify, toastResult } from "@/lib/notify";
import { routes } from "@/lib/routes";
import { deleteGoal, setGoalStatus, updateGoal } from "../actions";
import { goalUpdateSchema, type GoalUpdateInput } from "../schemas";
import { GoalFields } from "./goal-fields";

type GoalView = { id: string; title: string; why: string | null; area: string; target_date: string | null; status: "active" | "achieved" | "paused" };

export function GoalActions({ goal }: { goal: GoalView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const status = (next: GoalView["status"]) => {
    setBusy(next);
    startTransition(async () => {
      toastResult(await setGoalStatus(goal.id, next));
      setBusy(null);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {goal.status !== "achieved" ? (
        <Button size="sm" onClick={() => status("achieved")} loading={pending && busy === "achieved"}>
          <Trophy aria-hidden />
          Mark achieved
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => status("active")} loading={pending && busy === "active"}>
          <Play aria-hidden />
          Work on it again
        </Button>
      )}
      {goal.status === "active" ? (
        <Button size="sm" variant="secondary" onClick={() => status("paused")} loading={pending && busy === "paused"}>
          <Pause aria-hidden />
          Pause
        </Button>
      ) : goal.status === "paused" ? (
        <Button size="sm" variant="secondary" onClick={() => status("active")} loading={pending && busy === "active"}>
          <Play aria-hidden />
          Resume
        </Button>
      ) : null}
      <EditGoalDialog goal={goal} />
      <DeleteGoal goal={goal} onDeleted={() => router.replace(routes.goals)} />
    </div>
  );
}

function EditGoalDialog({ goal }: { goal: GoalView }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<GoalUpdateInput>({
    resolver: zodResolver(goalUpdateSchema),
    defaultValues: { title: goal.title, why: goal.why ?? "", area: goal.area, targetDate: goal.target_date ?? "" },
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = toastResult(await updateGoal(goal.id, values));
      if (!result.ok) return applyFieldErrors(form, result);
      setOpen(false);
    }),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset({ title: goal.title, why: goal.why ?? "", area: goal.area, targetDate: goal.target_date ?? "" });
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Pencil aria-hidden />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent title="Edit goal" className="sm:max-w-[520px]">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <GoalFields form={form} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteGoal({ goal, onDeleted }: { goal: GoalView; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const confirm = () =>
    startTransition(async () => {
      const result = await deleteGoal(goal.id);
      if (!result.ok) return void notify.error(result.error);
      setOpen(false);
      notify.success("Goal deleted");
      onDeleted();
    });
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-negative hover:bg-negative-soft">
          <Trash2 aria-hidden />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent title={`Delete "${goal.title}"?`} description="The goal and all of its steps will be removed for good. This can't be undone.">
        <AlertDialogCancel asChild>
          <Button variant="secondary">Keep it</Button>
        </AlertDialogCancel>
        <Button variant="danger-solid" onClick={confirm} loading={pending}>
          Delete goal
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}
