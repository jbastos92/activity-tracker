import { db } from "@/lib/db";
import { toNameKey } from "@/lib/validation/activities";

export type ActivitySummary = { id: string; name: string };

export type ActivityWriteResult =
  | { ok: true; activity: ActivitySummary }
  // "removed-name": the name belongs to an activity the owner removed.
  | { ok: false; reason: "duplicate" | "removed-name" | "not-found" };

const summary = { id: true, name: true } as const;

/** Activities that have not been removed, oldest first. */
export function listActiveActivities(): Promise<ActivitySummary[]> {
  return db.activity.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "asc" },
    select: summary,
  });
}

/**
 * Creates an activity. `name` must already be validated. A name matching a
 * removed activity restores that activity with its history (A-24).
 */
export async function createActivity(
  name: string,
): Promise<ActivityWriteResult> {
  const nameKey = toNameKey(name);
  const existing = await db.activity.findUnique({ where: { nameKey } });

  if (existing) {
    if (existing.archivedAt === null) return { ok: false, reason: "duplicate" };
    const restored = await db.activity.update({
      where: { id: existing.id },
      data: { archivedAt: null, name },
      select: summary,
    });
    return { ok: true, activity: restored };
  }

  try {
    const activity = await db.activity.create({
      data: { name, nameKey },
      select: summary,
    });
    return { ok: true, activity };
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) return { ok: false, reason: "duplicate" };
    throw error;
  }
}

/** Renames an activity. `name` must already be validated. */
export async function renameActivity(
  id: string,
  name: string,
): Promise<ActivityWriteResult> {
  const nameKey = toNameKey(name);
  const other = await db.activity.findUnique({ where: { nameKey } });
  if (other && other.id !== id) {
    return {
      ok: false,
      reason: other.archivedAt === null ? "duplicate" : "removed-name",
    };
  }

  try {
    const activity = await db.activity.update({
      where: { id },
      data: { name, nameKey },
      select: summary,
    });
    return { ok: true, activity };
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) return { ok: false, reason: "duplicate" };
    if (hasPrismaCode(error, "P2025")) return { ok: false, reason: "not-found" };
    throw error;
  }
}

/** Removes an activity by archiving it. The row and its Pomodoros are kept (A-24). */
export async function removeActivity(id: string): Promise<void> {
  await db.activity.updateMany({
    where: { id, archivedAt: null },
    data: { archivedAt: new Date() },
  });
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === code
  );
}
