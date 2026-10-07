"use server";

import { revalidatePath } from "next/cache";

import {
  createHabit,
  deleteHabit,
  renameHabit,
  setHabitCompletion,
} from "@/lib/data/habits";
import {
  habitCompletionSchema,
  habitNameSchema,
} from "@/lib/validation/habits";

export type HabitFormState = {
  error: string | null;
  // What the user typed, so the field keeps it when there is an error.
  name: string;
};

export async function createHabitAction(
  _previous: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  return save(formData, async (name) => {
    await createHabit(name);
    return null;
  });
}

export async function renameHabitAction(
  id: string,
  _previous: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  return save(formData, async (name) =>
    (await renameHabit(id, name)) ? null : "This habit no longer exists.",
  );
}

/** Deletes the habit and its history (A-10). */
export async function deleteHabitAction(id: string): Promise<void> {
  await deleteHabit(id);
  revalidatePath("/habits");
}

export type HabitCompletionResult = { ok: true } | { ok: false; error: string };

/** Marks a habit done or not done on a `YYYY-MM-DD` day. */
export async function setHabitCompletionAction(input: {
  habitId: string;
  date: string;
  done: boolean;
}): Promise<HabitCompletionResult> {
  const parsed = habitCompletionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "This could not be saved." };

  const result = await setHabitCompletion(parsed.data);
  revalidatePath("/habits");
  if (!result.ok) return { ok: false, error: "This habit no longer exists." };
  return { ok: true };
}

// `write` returns an error message, or null when it saved.
async function save(
  formData: FormData,
  write: (name: string) => Promise<string | null>,
): Promise<HabitFormState> {
  const typed = formData.get("name");
  const name = typeof typed === "string" ? typed : "";

  const parsed = habitNameSchema.safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, name };
  }

  const error = await write(parsed.data);
  if (error) return { error, name };

  revalidatePath("/habits");
  return { error: null, name: "" };
}
