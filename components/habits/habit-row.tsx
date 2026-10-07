"use client";

import { useActionState, useState } from "react";

import {
  type HabitFormState,
  deleteHabitAction,
  renameHabitAction,
} from "@/app/habits/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { HabitSummary } from "@/lib/data/habits";
import { HABIT_NAME_MAX } from "@/lib/validation/habits";

export function HabitRow({ habit }: { habit: HabitSummary }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      {editing ? (
        <RenameForm habit={habit} onDone={() => setEditing(false)} />
      ) : (
        <>
          <span className="min-w-0 break-words font-medium">{habit.name}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Rename
              <span className="sr-only"> {habit.name}</span>
            </Button>
            <DeleteDialog habit={habit} />
          </div>
        </>
      )}
    </li>
  );
}

function RenameForm({
  habit,
  onDone,
}: {
  habit: HabitSummary;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (previous: HabitFormState, formData: FormData) => {
      const next = await renameHabitAction(habit.id, previous, formData);
      if (next.error === null) onDone();
      return next;
    },
    { error: null, name: habit.name },
  );
  const errorId = `rename-error-${habit.id}`;

  return (
    <form action={formAction} className="flex w-full flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name="name"
          defaultValue={state.name || habit.name}
          maxLength={HABIT_NAME_MAX}
          autoComplete="off"
          autoFocus
          aria-label={`New name for ${habit.name}`}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
        />
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {state.error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}

function DeleteDialog({ habit }: { habit: HabitSummary }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Delete
          <span className="sr-only"> {habit.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{habit.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            The habit&rsquo;s history is removed too: every day it was marked
            done is deleted with it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <form action={deleteHabitAction.bind(null, habit.id)}>
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
