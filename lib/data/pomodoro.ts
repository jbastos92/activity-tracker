import { db } from "@/lib/db";
import type { CompletedFocus } from "@/lib/validation/pomodoro";

export type RecordFocusResult =
  | { ok: true }
  | { ok: false; reason: "unknown-activity" };

/**
 * Stores a completed focus period. `focus` must already be validated. Saving
 * the same period again, recognised by its start time, leaves the one row as
 * it is. A removed activity is accepted, so a Pomodoro finished after its
 * activity was removed is not lost.
 */
export async function recordCompletedFocus(
  focus: CompletedFocus,
): Promise<RecordFocusResult> {
  const activity = await db.activity.findUnique({
    where: { id: focus.activityId },
    select: { id: true },
  });
  if (!activity) return { ok: false, reason: "unknown-activity" };

  try {
    await db.pomodoroSession.upsert({
      where: { startedAt: focus.startedAt },
      create: focus,
      update: {},
    });
  } catch (error) {
    // Two tabs saving the same period at once: the other one won.
    if (!hasPrismaCode(error, "P2002")) throw error;
  }
  return { ok: true };
}

/** The number of Pomodoros completed on `date`, a `YYYY-MM-DD` day. */
export function countPomodorosOn(date: string): Promise<number> {
  return db.pomodoroSession.count({ where: { date } });
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === code
  );
}
