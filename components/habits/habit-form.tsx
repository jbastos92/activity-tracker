"use client";

import { useActionState } from "react";

import { type HabitFormState, createHabitAction } from "@/app/habits/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HABIT_NAME_MAX } from "@/lib/validation/habits";

const initialState: HabitFormState = { error: null, name: "" };

export function HabitForm() {
  const [state, formAction, pending] = useActionState(
    createHabitAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="new-habit-name">New habit</Label>
      <div className="flex gap-2">
        <Input
          id="new-habit-name"
          name="name"
          defaultValue={state.name}
          maxLength={HABIT_NAME_MAX}
          placeholder="For example: Meditate"
          autoComplete="off"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "new-habit-error" : undefined}
        />
        <Button type="submit" disabled={pending}>
          Add
        </Button>
      </div>
      {state.error && (
        <p id="new-habit-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
