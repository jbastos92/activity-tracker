"use server";

import { revalidatePath } from "next/cache";

import { createHabit } from "@/lib/data/habits";
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
  const typed = formData.get("name");
  const name = typeof typed === "string" ? typed : "";

  const parsed = habitNameSchema.safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, name };
  }

  await createHabit(parsed.data);
  revalidatePath("/habits");
  return { error: null, name: "" };
}
