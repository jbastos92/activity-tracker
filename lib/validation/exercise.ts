import { z } from "zod";

import { parseDay } from "@/lib/dates";

export const EXERCISE_ACTIVITY_MAX = 80;
export const EXERCISE_DURATION_MAX = 1440;
export const EXERCISE_NOTES_MAX = 500;

const DURATION_RANGE = `Enter a duration from 1 to ${EXERCISE_DURATION_MAX} minutes.`;

/**
 * One exercise log entry (A-11, A-12). `today` is the user's local day,
 * `YYYY-MM-DD`: an entry cannot be dated after it. The duration may arrive as
 * text, as a form sends it. Blank notes parse to null.
 */
export function exerciseEntrySchema(today: string) {
  return z.object({
    date: z
      .string("Enter a valid date.")
      .refine((value) => parseDay(value) !== null, "Enter a valid date.")
      // `YYYY-MM-DD` days compare correctly as text.
      .refine((value) => value <= today, "The date cannot be in the future."),
    activity: z
      .string("Enter an activity.")
      .trim()
      .min(1, "Enter an activity.")
      .max(EXERCISE_ACTIVITY_MAX, `Use ${EXERCISE_ACTIVITY_MAX} characters or fewer.`),
    durationMinutes: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() !== "" ? Number(value) : value,
      z
        .number("Enter the duration in minutes.")
        .int("Use whole minutes.")
        .min(1, DURATION_RANGE)
        .max(EXERCISE_DURATION_MAX, DURATION_RANGE),
    ),
    notes: z
      .string()
      .trim()
      .max(EXERCISE_NOTES_MAX, `Use ${EXERCISE_NOTES_MAX} characters or fewer.`)
      .nullish()
      .transform((value) => value || null),
  });
}

export type ExerciseEntryInput = z.output<ReturnType<typeof exerciseEntrySchema>>;
