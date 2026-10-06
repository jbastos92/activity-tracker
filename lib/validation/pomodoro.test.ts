import { describe, expect, it } from "vitest";

import { completedFocusSchema } from "@/lib/validation/pomodoro";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const T0 = Date.UTC(2026, 9, 6, 12, 0, 0);

/** A focus period of the full 25 minutes, with one or more fields replaced. */
function input(overrides: Record<string, unknown> = {}) {
  return {
    activityId: "a1",
    startedAt: T0,
    endedAt: T0 + 25 * MINUTE,
    date: "2026-10-06",
    ...overrides,
  };
}

function accepts(value: unknown): boolean {
  return completedFocusSchema.safeParse(value).success;
}

describe("completedFocusSchema", () => {
  it("turns a full focus period into the values to store", () => {
    expect(completedFocusSchema.parse(input())).toEqual({
      activityId: "a1",
      startedAt: new Date("2026-10-06T12:00:00.000Z"),
      endedAt: new Date("2026-10-06T12:25:00.000Z"),
      durationSeconds: 1500,
      date: "2026-10-06",
    });
  });

  it("rejects a missing or empty activity", () => {
    expect(accepts(input({ activityId: "" }))).toBe(false);
    expect(accepts(input({ activityId: undefined }))).toBe(false);
    expect(accepts(input({ activityId: 7 }))).toBe(false);
  });

  it("rejects an end that is before the start", () => {
    expect(accepts(input({ endedAt: T0 - SECOND }))).toBe(false);
  });

  it("rejects an end equal to the start", () => {
    expect(accepts(input({ endedAt: T0 }))).toBe(false);
  });

  it("accepts a duration up to 5 seconds over the focus length and no more", () => {
    expect(accepts(input({ endedAt: T0 + 25 * MINUTE + 5 * SECOND }))).toBe(true);
    expect(accepts(input({ endedAt: T0 + 25 * MINUTE + 6 * SECOND }))).toBe(false);
  });

  it("rejects times that are not whole epoch milliseconds", () => {
    expect(accepts(input({ startedAt: "2026-10-06T12:00:00.000Z" }))).toBe(false);
    expect(accepts(input({ startedAt: Number.NaN }))).toBe(false);
    expect(accepts(input({ endedAt: Number.POSITIVE_INFINITY }))).toBe(false);
    expect(accepts(input({ startedAt: T0 + 0.5 }))).toBe(false);
    expect(accepts(input({ startedAt: -1 }))).toBe(false);
  });

  it("rejects a date that is not a real YYYY-MM-DD day", () => {
    expect(accepts(input({ date: "06/10/2026" }))).toBe(false);
    expect(accepts(input({ date: "2026-02-30" }))).toBe(false);
    expect(accepts(input({ date: "" }))).toBe(false);
    expect(accepts(input({ date: undefined }))).toBe(false);
  });

  it("rejects values that are not an object", () => {
    expect(accepts(null)).toBe(false);
    expect(accepts("a1")).toBe(false);
  });
});
