import { db } from "@/lib/db";
import type { ExerciseEntryInput } from "@/lib/validation/exercise";

export type ExerciseEntry = {
  id: string;
  // The user's local calendar day, `YYYY-MM-DD`.
  date: string;
  activity: string;
  durationMinutes: number;
  notes: string | null;
};

const fields = {
  id: true,
  date: true,
  activity: true,
  durationMinutes: true,
  notes: true,
} as const;

/** The `limit` most recent entries: newest date first, then newest created first. */
export function listExerciseEntries(limit: number): Promise<ExerciseEntry[]> {
  return db.exerciseEntry.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: fields,
  });
}

/** Creates an entry. `entry` must already be validated. */
export function createExerciseEntry(
  entry: ExerciseEntryInput,
): Promise<ExerciseEntry> {
  return db.exerciseEntry.create({ data: entry, select: fields });
}

/** Updates an entry. `entry` must already be validated. Null if the entry does not exist. */
export async function updateExerciseEntry(
  id: string,
  entry: ExerciseEntryInput,
): Promise<ExerciseEntry | null> {
  try {
    return await db.exerciseEntry.update({
      where: { id },
      data: entry,
      select: fields,
    });
  } catch (error) {
    if (hasPrismaCode(error, "P2025")) return null;
    throw error;
  }
}

export async function deleteExerciseEntry(id: string): Promise<void> {
  await db.exerciseEntry.deleteMany({ where: { id } });
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === code
  );
}
