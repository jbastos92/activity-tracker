"use server";

import { revalidatePath } from "next/cache";

import {
  type ActivityWriteResult,
  createActivity,
  removeActivity,
  renameActivity,
} from "@/lib/data/activities";
import { activityNameSchema } from "@/lib/validation/activities";

export type ActivityFormState = {
  error: string | null;
  // What the user typed, so the field keeps it when there is an error.
  name: string;
};

const MESSAGES: Record<
  Exclude<ActivityWriteResult, { ok: true }>["reason"],
  string
> = {
  duplicate: "An activity with this name already exists.",
  "removed-name":
    "This name belongs to an activity you removed. Add it again to bring it back.",
  "not-found": "This activity no longer exists.",
};

export async function createActivityAction(
  _previous: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  return save(formData, createActivity);
}

export async function renameActivityAction(
  id: string,
  _previous: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  return save(formData, (name) => renameActivity(id, name));
}

export async function removeActivityAction(id: string): Promise<void> {
  await removeActivity(id);
  revalidate();
}

async function save(
  formData: FormData,
  write: (name: string) => Promise<ActivityWriteResult>,
): Promise<ActivityFormState> {
  const typed = formData.get("name");
  const name = typeof typed === "string" ? typed : "";

  const parsed = activityNameSchema.safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, name };
  }

  const result = await write(parsed.data);
  if (!result.ok) return { error: MESSAGES[result.reason], name };

  revalidate();
  return { error: null, name: "" };
}

function revalidate() {
  revalidatePath("/pomodoro");
  revalidatePath("/pomodoro/activities");
}
