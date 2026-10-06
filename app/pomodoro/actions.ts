"use server";

import { revalidatePath } from "next/cache";

import { recordCompletedFocus } from "@/lib/data/pomodoro";
import { completedFocusSchema } from "@/lib/validation/pomodoro";

export type RecordFocusActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Records a completed focus period: `activityId`, `startedAt` and `endedAt`
 * in epoch milliseconds, and the user's local `date` as YYYY-MM-DD. Safe to
 * call again for the same period.
 */
export async function recordCompletedFocusAction(
  input: unknown,
): Promise<RecordFocusActionResult> {
  const parsed = completedFocusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "This Pomodoro could not be saved." };
  }

  const result = await recordCompletedFocus(parsed.data);
  if (!result.ok) {
    return { ok: false, error: "The activity of this Pomodoro no longer exists." };
  }

  revalidatePath("/pomodoro");
  return { ok: true };
}
