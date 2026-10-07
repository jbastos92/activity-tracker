"use client";

import { useActionState, useId } from "react";

import {
  type ExerciseField,
  type ExerciseFormState,
  createExerciseEntryAction,
  updateExerciseEntryAction,
} from "@/app/exercise/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExerciseEntry } from "@/lib/data/exercise";
import {
  EXERCISE_ACTIVITY_MAX,
  EXERCISE_DURATION_MAX,
  EXERCISE_NOTES_MAX,
} from "@/lib/validation/exercise";

/**
 * The form for one exercise entry. Without `entry` it logs a new one; with
 * `entry` it edits that one and calls `onSaved` once the change is saved.
 */
export function ExerciseForm({
  today,
  entry,
  onSaved,
}: {
  // The user's local day, `YYYY-MM-DD`.
  today: string;
  entry?: ExerciseEntry;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (previous: ExerciseFormState, formData: FormData) => {
      const next = entry
        ? await updateExerciseEntryAction(entry.id, previous, formData)
        : await createExerciseEntryAction(previous, formData);
      if (next.status === "saved") onSaved?.();
      return next;
    },
    {
      status: "idle",
      errors: {},
      formError: null,
      values: {
        date: entry?.date ?? today,
        activity: entry?.activity ?? "",
        durationMinutes: entry ? String(entry.durationMinutes) : "",
        notes: entry?.notes ?? "",
      },
    },
  );
  const id = useId();

  // The props every field shares: its id, name, value and error wiring.
  function field(name: ExerciseField) {
    const error = state.errors[name];
    return {
      id: `${id}-${name}`,
      name,
      defaultValue: state.values[name],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${id}-${name}-error` : undefined,
    };
  }

  function message(name: ExerciseField) {
    const error = state.errors[name];
    if (!error) return null;
    return (
      <p id={`${id}-${name}-error`} role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    // noValidate: the server's messages are shown inline instead of the browser's bubbles.
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-date`}>Date</Label>
          <Input type="date" max={today} {...field("date")} />
          {message("date")}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-durationMinutes`}>Duration (minutes)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={EXERCISE_DURATION_MAX}
            step={1}
            {...field("durationMinutes")}
          />
          {message("durationMinutes")}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-activity`}>Activity</Label>
        <Input
          maxLength={EXERCISE_ACTIVITY_MAX}
          placeholder="For example: Running"
          autoComplete="off"
          {...field("activity")}
        />
        {message("activity")}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-notes`}>Notes (optional)</Label>
        <Textarea maxLength={EXERCISE_NOTES_MAX} {...field("notes")} />
        {message("notes")}
      </div>
      {state.formError && (
        <p role="alert" className="text-sm text-destructive">
          {state.formError}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {entry ? "Save" : "Log exercise"}
        </Button>
      </div>
    </form>
  );
}
