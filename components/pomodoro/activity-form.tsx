"use client";

import { useActionState } from "react";

import {
  type ActivityFormState,
  createActivityAction,
} from "@/app/pomodoro/activities/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACTIVITY_NAME_MAX } from "@/lib/validation/activities";

const initialState: ActivityFormState = { error: null, name: "" };

export function ActivityForm() {
  const [state, formAction, pending] = useActionState(
    createActivityAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="new-activity-name">New activity</Label>
      <div className="flex gap-2">
        <Input
          id="new-activity-name"
          name="name"
          defaultValue={state.name}
          maxLength={ACTIVITY_NAME_MAX}
          placeholder="For example: Read"
          autoComplete="off"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "new-activity-error" : undefined}
        />
        <Button type="submit" disabled={pending}>
          Add
        </Button>
      </div>
      {state.error && (
        <p id="new-activity-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
