import { db } from "@/lib/db";
import type { HabitCompletionInput } from "@/lib/validation/habits";

export type HabitSummary = { id: string; name: string };

export type HabitWithCompletions = HabitSummary & {
  // The days the habit was done, `YYYY-MM-DD`, oldest first.
  completedDays: string[];
};

export type SetCompletionResult =
  | { ok: true }
  | { ok: false; reason: "not-found" };

const summary = { id: true, name: true } as const;

/**
 * All habits, oldest first, each with the days it was done from `from` to
 * `to`, both included and both `YYYY-MM-DD`.
 */
export async function listHabitsWithCompletions(
  from: string,
  to: string,
): Promise<HabitWithCompletions[]> {
  const habits = await db.habit.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      ...summary,
      completions: {
        where: { date: { gte: from, lte: to } },
        orderBy: { date: "asc" },
        select: { date: true },
      },
    },
  });
  return habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    completedDays: habit.completions.map((completion) => completion.date),
  }));
}

/** Creates a habit. `name` must already be validated. */
export function createHabit(name: string): Promise<HabitSummary> {
  return db.habit.create({ data: { name }, select: summary });
}

/** Renames a habit. `name` must already be validated. Null if the habit does not exist. */
export async function renameHabit(
  id: string,
  name: string,
): Promise<HabitSummary | null> {
  try {
    return await db.habit.update({
      where: { id },
      data: { name },
      select: summary,
    });
  } catch (error) {
    if (hasPrismaCode(error, "P2025")) return null;
    throw error;
  }
}

/** Deletes a habit and, through the cascade, its completions (A-10). */
export async function deleteHabit(id: string): Promise<void> {
  await db.habit.deleteMany({ where: { id } });
}

/**
 * Marks a habit done or not done on a day. `completion` must already be
 * validated. Repeating the same call changes nothing: done is one row, not
 * done is no row.
 */
export async function setHabitCompletion(
  completion: HabitCompletionInput,
): Promise<SetCompletionResult> {
  const { habitId, date, done } = completion;

  if (!done) {
    await db.habitCompletion.deleteMany({ where: { habitId, date } });
    return { ok: true };
  }

  const habit = await db.habit.findUnique({
    where: { id: habitId },
    select: { id: true },
  });
  if (!habit) return { ok: false, reason: "not-found" };

  try {
    await db.habitCompletion.upsert({
      where: { habitId_date: { habitId, date } },
      create: { habitId, date },
      update: {},
    });
  } catch (error) {
    // Two requests marking the same day at once: the other one won.
    if (!hasPrismaCode(error, "P2002")) throw error;
  }
  return { ok: true };
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === code
  );
}
