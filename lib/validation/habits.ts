import { z } from "zod";

import { parseDay } from "@/lib/dates";

export const HABIT_NAME_MAX = 80;

export const habitNameSchema = z
  .string("Enter a name.")
  .trim()
  .min(1, "Enter a name.")
  .max(HABIT_NAME_MAX, `Use ${HABIT_NAME_MAX} characters or fewer.`);

/** Marks a habit done or not done on one `YYYY-MM-DD` day. */
export const habitCompletionSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().refine((value) => parseDay(value) !== null, "Not a day."),
  done: z.boolean(),
});

export type HabitCompletionInput = z.output<typeof habitCompletionSchema>;
