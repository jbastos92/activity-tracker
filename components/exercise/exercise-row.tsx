"use client";

import { useState } from "react";

import { deleteExerciseEntryAction } from "@/app/exercise/actions";
import { ExerciseForm } from "@/components/exercise/exercise-form";
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
import type { ExerciseEntry } from "@/lib/data/exercise";
import { formatDuration } from "@/lib/exercise/list";

export function ExerciseRow({
  entry,
  today,
}: {
  entry: ExerciseEntry;
  // The user's local day, `YYYY-MM-DD`.
  today: string;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 px-3 py-2">
      <div className="min-w-0">
        <p className="break-words">
          <span className="font-medium">{entry.activity}</span>
          <span className="text-muted-foreground">
            {" "}
            &middot; {formatDuration(entry.durationMinutes)}
          </span>
        </p>
        {entry.notes && (
          <p className="mt-1 text-sm break-words whitespace-pre-wrap text-muted-foreground">
            {entry.notes}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <EditDialog entry={entry} today={today} />
        <DeleteDialog entry={entry} />
      </div>
    </li>
  );
}

function EditDialog({ entry, today }: { entry: ExerciseEntry; today: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
          <span className="sr-only"> {entry.activity}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit entry</DialogTitle>
          <DialogDescription>
            Change the date, activity, duration or notes.
          </DialogDescription>
        </DialogHeader>
        <ExerciseForm today={today} entry={entry} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ entry }: { entry: ExerciseEntry }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Delete
          <span className="sr-only"> {entry.activity}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{entry.activity}&rdquo;?</DialogTitle>
          <DialogDescription>
            This entry of {formatDuration(entry.durationMinutes)} is removed from
            the log. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <form action={deleteExerciseEntryAction.bind(null, entry.id)}>
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
