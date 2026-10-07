"use server";

import { revalidatePath } from "next/cache";

import {
  createExerciseEntry,
  deleteExerciseEntry,
  updateExerciseEntry,
} from "@/lib/data/exercise";
import { getToday } from "@/lib/today";
import {
  type ExerciseEntryInput,
  exerciseEntrySchema,
} from "@/lib/validation/exercise";

const FIELDS = ["date", "activity", "durationMinutes", "notes"] as const;

export type ExerciseField = (typeof FIELDS)[number];

export type ExerciseFormState = {
  // "saved" after a successful submit, so the form can tell it from the start.
  status: "idle" | "saved" | "error";
  // One message per invalid field.
  errors: Partial<Record<ExerciseField, string>>;
  // A problem that belongs to no field.
  formError: string | null;
  // What the fields show next: what the user typed, or the cleared form.
  values: Record<ExerciseField, string>;
};

/** Logs an entry. Afterwards the date is kept and the other fields are cleared. */
export async function createExerciseEntryAction(
  _previous: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  return save(formData, async (entry, typed) => {
    await createExerciseEntry(entry);
    return { date: typed.date, activity: "", durationMinutes: "", notes: "" };
  });
}

export async function updateExerciseEntryAction(
  id: string,
  _previous: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  return save(formData, async (entry, typed) =>
    (await updateExerciseEntry(id, entry)) ? typed : null,
  );
}

export async function deleteExerciseEntryAction(id: string): Promise<void> {
  await deleteExerciseEntry(id);
  revalidatePath("/exercise");
}

// `write` returns the values the form shows next, or null when the entry is gone.
async function save(
  formData: FormData,
  write: (
    entry: ExerciseEntryInput,
    typed: ExerciseFormState["values"],
  ) => Promise<ExerciseFormState["values"] | null>,
): Promise<ExerciseFormState> {
  const typed = Object.fromEntries(
    FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  ) as ExerciseFormState["values"];

  const parsed = exerciseEntrySchema(await getToday()).safeParse(typed);
  if (!parsed.success) {
    const errors: ExerciseFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = FIELDS.find((name) => name === issue.path[0]);
      // Keep the first message of each field.
      if (field && !errors[field]) errors[field] = issue.message;
    }
    return { status: "error", errors, formError: null, values: typed };
  }

  const next = await write(parsed.data, typed);
  revalidatePath("/exercise");
  if (!next) {
    return {
      status: "error",
      errors: {},
      formError: "This entry no longer exists.",
      values: typed,
    };
  }
  return { status: "saved", errors: {}, formError: null, values: next };
}
