"use client";

import { useActionState, useOptimistic, useState, useTransition } from "react";

import {
  type HabitFormState,
  deleteHabitAction,
  renameHabitAction,
  setHabitCompletionAction,
} from "@/app/habits/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { HabitSummary, HabitWithCompletions } from "@/lib/data/habits";
import type { HabitDay } from "@/lib/habits/days";
import { cn } from "@/lib/utils";
import { HABIT_NAME_MAX } from "@/lib/validation/habits";

// The 7 day columns; the header and every row use it so the columns line up.
// It scrolls sideways by itself if the screen is too narrow for it.
const DAY_GRID = "grid w-full max-w-xs min-w-56 grid-cols-7";
const DAY_CELL = "flex flex-col items-center justify-center rounded-md py-1.5";
const TODAY_CELL = "bg-muted font-semibold text-foreground";

export function HabitDaysHeader({ days }: { days: HabitDay[] }) {
  return (
    <div className="overflow-x-auto border-b px-3 py-2">
      <div className={cn(DAY_GRID, "text-xs text-muted-foreground")}>
        {days.map((day) => (
          <div key={day.date} className={cn(DAY_CELL, day.isToday && TODAY_CELL)}>
            <span>{day.weekday}</span>
            <span>{day.dayNumber}</span>
            {day.isToday && <span className="sr-only">(today)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HabitRow({
  habit,
  days,
}: {
  habit: HabitWithCompletions;
  // The last 7 days, today last.
  days: HabitDay[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="flex flex-col gap-2 px-3 py-2">
      {editing ? (
        <RenameForm habit={habit} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 break-words font-medium">{habit.name}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Rename
              <span className="sr-only"> {habit.name}</span>
            </Button>
            <DeleteDialog habit={habit} />
          </div>
        </div>
      )}
      <DayCheckboxes habit={habit} days={days} />
    </li>
  );
}

function DayCheckboxes({
  habit,
  days,
}: {
  habit: HabitWithCompletions;
  days: HabitDay[];
}) {
  const [error, setError] = useState<string | null>(null);
  const errorId = `completion-error-${habit.id}`;

  return (
    <>
      <div className="overflow-x-auto">
        <div className={DAY_GRID}>
          {days.map((day) => (
            <div key={day.date} className={cn(DAY_CELL, day.isToday && TODAY_CELL)}>
              <DayCheckbox
                habit={habit}
                day={day}
                done={habit.completedDays.includes(day.date)}
                errorId={error ? errorId : undefined}
                onResult={setError}
              />
            </div>
          ))}
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

function DayCheckbox({
  habit,
  day,
  done,
  errorId,
  onResult,
}: {
  habit: HabitSummary;
  day: HabitDay;
  done: boolean;
  errorId: string | undefined;
  // Called with the error message of a save, or null when it starts or succeeds.
  onResult: (error: string | null) => void;
}) {
  // Shows the new state at once; falls back to the saved one if saving fails.
  const [shownDone, setShownDone] = useOptimistic(done);
  const [, startTransition] = useTransition();
  const when = day.isToday ? "today" : `on ${day.weekday} ${day.dayNumber}`;

  function toggle(next: boolean) {
    startTransition(async () => {
      setShownDone(next);
      onResult(null);
      try {
        const result = await setHabitCompletionAction({
          habitId: habit.id,
          date: day.date,
          done: next,
        });
        if (!result.ok) onResult(result.error);
      } catch {
        onResult("This could not be saved. Try again.");
      }
    });
  }

  return (
    <Checkbox
      checked={shownDone}
      onCheckedChange={(value) => toggle(value === true)}
      aria-label={`${habit.name}: done ${when}`}
      aria-describedby={errorId}
    />
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
