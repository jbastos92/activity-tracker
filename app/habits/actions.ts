"use server";

import { revalidatePath } from "next/cache";

import { createHabit, deleteHabit, renameHabit } from "@/lib/data/habits";
import { habitNameSchema } from "@/lib/validation/habits";

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
