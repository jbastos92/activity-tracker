"use client";

import { useActionState, useState } from "react";

import {
  type ActivityFormState,
  removeActivityAction,
  renameActivityAction,
} from "@/app/pomodoro/activities/actions";
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
import type { ActivitySummary } from "@/lib/data/activities";
import { ACTIVITY_NAME_MAX } from "@/lib/validation/activities";

export function ActivityList({ activities }: { activities: ActivitySummary[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No activities yet</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {activities.map((activity) => (
        <ActivityRow key={activity.id} activity={activity} />
      ))}
    </ul>
  );
}

function ActivityRow({ activity }: { activity: ActivitySummary }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      {editing ? (
        <RenameForm activity={activity} onDone={() => setEditing(false)} />
      ) : (
        <>
          <span className="min-w-0 break-words font-medium">{activity.name}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Rename
              <span className="sr-only"> {activity.name}</span>
            </Button>
            <RemoveDialog activity={activity} />
          </div>
        </>
      )}
    </li>
  );
}

function RenameForm({
  activity,
  onDone,
}: {
  activity: ActivitySummary;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (previous: ActivityFormState, formData: FormData) => {
      const next = await renameActivityAction(activity.id, previous, formData);
      if (next.error === null) onDone();
      return next;
    },
    { error: null, name: activity.name },
  );
  const errorId = `rename-error-${activity.id}`;

  return (
    <form action={formAction} className="flex w-full flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name="name"
          defaultValue={state.name || activity.name}
          maxLength={ACTIVITY_NAME_MAX}
          autoComplete="off"
          autoFocus
          aria-label={`New name for ${activity.name}`}
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

function RemoveDialog({ activity }: { activity: ActivitySummary }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Remove
          <span className="sr-only"> {activity.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove &ldquo;{activity.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            Pomodoros already recorded for this activity are kept and still
            counted in the statistics. It will no longer be offered when you
            start a focus period.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <form action={removeActivityAction.bind(null, activity.id)}>
            <Button type="submit" variant="destructive">
              Remove
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
