// Completed focus periods that are not in the database yet. The list is kept
// in localStorage so a Pomodoro survives a failed save, a reload or a closed
// tab until it is recorded.

import { toDayString } from "@/lib/dates";
import type { TimerState } from "@/lib/pomodoro/timer";

/** What the record action takes: times in epoch milliseconds, `date` as YYYY-MM-DD. */
export type UnsavedFocus = {
  activityId: string;
  startedAt: number;
  endedAt: number;
  date: string;
};

/**
 * The record for a started focus period, or null for anything else. The end
 * is the planned end, not the moment it was noticed, and `date` is the day
 * of that end in `timeZone`.
 */
export function toUnsavedFocus(
  state: TimerState,
  timeZone: string,
): UnsavedFocus | null {
  if (state.phase !== "focus" || !state.activity) return null;
  if (state.startedAt === null || state.endsAt === null) return null;
  return {
    activityId: state.activity.id,
    startedAt: state.startedAt,
    endedAt: state.endsAt,
    date: toDayString(new Date(state.endsAt), timeZone),
  };
}

/** Adds a period; one that is already listed, by its start time, is not added again. */
export function addUnsaved(
  list: UnsavedFocus[],
  focus: UnsavedFocus,
): UnsavedFocus[] {
  if (list.some((entry) => entry.startedAt === focus.startedAt)) return list;
  return [...list, focus];
}

export function removeUnsaved(
  list: UnsavedFocus[],
  startedAt: number,
): UnsavedFocus[] {
  return list.filter((entry) => entry.startedAt !== startedAt);
}

/** Reads a list saved as JSON, leaving out anything that is not a complete period. */
export function parseUnsaved(raw: string | null): UnsavedFocus[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  return value.filter(isUnsavedFocus).map((entry) => ({
    activityId: entry.activityId,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
    date: entry.date,
  }));
}

function isUnsavedFocus(value: unknown): value is UnsavedFocus {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.activityId === "string" &&
    typeof entry.startedAt === "number" &&
    Number.isFinite(entry.startedAt) &&
    typeof entry.endedAt === "number" &&
    Number.isFinite(entry.endedAt) &&
    typeof entry.date === "string"
  );
}
