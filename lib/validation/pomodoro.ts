import { z } from "zod";

import { parseDay } from "@/lib/dates";
import { phaseDurationMs } from "@/lib/pomodoro/timer";

// How much longer than the configured focus length a recorded period may be.
export const FOCUS_DURATION_TOLERANCE_MS = 5_000;

const epochMs = z.number().int().nonnegative();

/**
 * A completed focus period as the browser reports it: times in epoch
 * milliseconds and the user's local day. Parses to the values to store.
 */
export const completedFocusSchema = z
  .object({
    activityId: z.string().min(1),
    startedAt: epochMs,
    endedAt: epochMs,
    date: z.string().refine((value) => parseDay(value) !== null, "Not a day."),
  })
  .refine((focus) => focus.endedAt > focus.startedAt, {
    path: ["endedAt"],
    message: "The end must be after the start.",
  })
  .refine(
    (focus) =>
      focus.endedAt - focus.startedAt <=
      phaseDurationMs("focus") + FOCUS_DURATION_TOLERANCE_MS,
    { path: ["endedAt"], message: "Longer than a focus period." },
  )
  .transform((focus) => ({
    activityId: focus.activityId,
    startedAt: new Date(focus.startedAt),
    endedAt: new Date(focus.endedAt),
    durationSeconds: Math.round((focus.endedAt - focus.startedAt) / 1000),
    date: focus.date,
  }));

export type CompletedFocus = z.output<typeof completedFocusSchema>;
