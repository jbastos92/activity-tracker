import { db } from "@/lib/db";
import type { DayCounts } from "@/lib/pomodoro/stats";
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

export type ActivityTotal = {
  id: string;
  name: string;
  // The owner removed the activity; its Pomodoros still count (A-24).
  removed: boolean;
  count: number;
};

/**
 * The all-time number of Pomodoros of every activity, removed ones included.
 * An activity with none is listed with count 0.
 */
export async function countPomodorosByActivity(): Promise<ActivityTotal[]> {
  const activities = await db.activity.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      archivedAt: true,
      _count: { select: { sessions: true } },
    },
  });
  return activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    removed: activity.archivedAt !== null,
    count: activity._count.sessions,
  }));
}

/**
 * The number of Pomodoros on each day from `from` to `to`, both included and
 * both `YYYY-MM-DD`. Days with none are left out.
 */
export async function countPomodorosByDate(
  from: string,
  to: string,
): Promise<DayCounts> {
  const rows = await db.pomodoroSession.groupBy({
    by: ["date"],
    where: { date: { gte: from, lte: to } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.date, row._count._all]));
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === code
  );
}
