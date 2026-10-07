import { describe, expect, it } from "vitest";

import { type TimerState } from "@/lib/pomodoro/timer";
import {
  type UnsavedFocus,
  addUnsaved,
  parseUnsaved,
  removeUnsaved,
  toUnsavedFocus,
} from "@/lib/pomodoro/unsaved";

const MINUTE = 60_000;
// 2026-10-07 02:50 UTC; a focus period from here ends at 03:15 UTC.
const T0 = Date.UTC(2026, 9, 7, 2, 50, 0);

const read: UnsavedFocus = {
  activityId: "a1",
  startedAt: T0,
  endedAt: T0 + 25 * MINUTE,
  date: "2026-10-07",
};
const write: UnsavedFocus = {
  activityId: "a2",
  startedAt: T0 + 30 * MINUTE,
  endedAt: T0 + 55 * MINUTE,
  date: "2026-10-07",
};

function focusState(overrides: Partial<TimerState> = {}): TimerState {
  return {
    phase: "focus",
    status: "running",
    startedAt: T0,
    endsAt: T0 + 25 * MINUTE,
    completedFocusCount: 0,
    activity: { id: "a1", name: "Read" },
    breakJustEnded: false,
    ...overrides,
  };
}

describe("toUnsavedFocus", () => {
  it("describes a focus period by its activity, start and planned end", () => {
    expect(toUnsavedFocus(focusState(), "UTC")).toEqual({
      activityId: "a1",
      startedAt: T0,
      endedAt: T0 + 25 * MINUTE,
      date: "2026-10-07",
    });
  });

  it("takes the day from the end of the period in the given time zone", () => {
    // Sao Paulo (UTC-3): starts 23:50 on the 6th, ends 00:15 on the 7th.
    expect(toUnsavedFocus(focusState(), "America/Sao_Paulo")?.date).toBe("2026-10-07");
    // Manaus (UTC-4): ends 23:15 on the 6th.
    expect(toUnsavedFocus(focusState(), "America/Manaus")?.date).toBe("2026-10-06");
  });

  it("is null for a break", () => {
    expect(
      toUnsavedFocus(focusState({ phase: "shortBreak", activity: null }), "UTC"),
    ).toBeNull();
  });

  it("is null for a focus phase that has not started", () => {
    expect(
      toUnsavedFocus(
        focusState({ status: "idle", startedAt: null, endsAt: null, activity: null }),
        "UTC",
      ),
    ).toBeNull();
  });
});

describe("addUnsaved", () => {
  it("appends a period", () => {
    expect(addUnsaved([read], write)).toEqual([read, write]);
  });

  it("keeps one entry when the same period is added twice", () => {
    expect(addUnsaved([read], { ...read })).toEqual([read]);
  });
});

describe("removeUnsaved", () => {
  it("removes the period that started at the given time", () => {
    expect(removeUnsaved([read, write], read.startedAt)).toEqual([write]);
  });

  it("leaves the list alone when nothing matches", () => {
    expect(removeUnsaved([read], 1)).toEqual([read]);
  });
});

describe("parseUnsaved", () => {
  it("reads back what was saved as JSON", () => {
    expect(parseUnsaved(JSON.stringify([read, write]))).toEqual([read, write]);
  });

  it("is empty for nothing, broken JSON or a value that is not a list", () => {
    expect(parseUnsaved(null)).toEqual([]);
    expect(parseUnsaved("{oops")).toEqual([]);
    expect(parseUnsaved(JSON.stringify({ activityId: "a1" }))).toEqual([]);
  });

  it("drops entries that are not complete periods", () => {
    const raw = JSON.stringify([
      read,
      null,
      { ...write, startedAt: "soon" },
      { ...write, date: undefined },
      { ...write, activityId: 5 },
    ]);
    expect(parseUnsaved(raw)).toEqual([read]);
  });
});
