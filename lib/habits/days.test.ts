import { describe, expect, it } from "vitest";

import { HABIT_DAYS, habitDays, isEditableHabitDay } from "@/lib/habits/days";

describe("habitDays", () => {
  it("returns the last 7 days, oldest first and today last", () => {
    const days = habitDays("2026-10-07");
    expect(days).toHaveLength(HABIT_DAYS);
    expect(days.map((day) => day.date)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
    ]);
  });

  it("gives each day its weekday and day number", () => {
    const days = habitDays("2026-10-07");
    expect(days.map((day) => `${day.weekday} ${day.dayNumber}`)).toEqual([
      "Thu 1",
      "Fri 2",
      "Sat 3",
      "Sun 4",
      "Mon 5",
      "Tue 6",
      "Wed 7",
    ]);
  });

  it("marks only today", () => {
    const days = habitDays("2026-10-07");
    expect(days.filter((day) => day.isToday).map((day) => day.date)).toEqual([
      "2026-10-07",
    ]);
  });

  it("crosses a month and a year boundary", () => {
    const days = habitDays("2027-01-02");
    expect(days[0]).toEqual({
      date: "2026-12-27",
      weekday: "Sun",
      dayNumber: 27,
      isToday: false,
    });
    expect(days[6]).toEqual({
      date: "2027-01-02",
      weekday: "Sat",
      dayNumber: 2,
      isToday: true,
    });
  });

  it("returns nothing for an invalid today", () => {
    expect(habitDays("not-a-day")).toEqual([]);
  });
});

describe("isEditableHabitDay", () => {
  const today = "2026-10-07";

  it("accepts today and the 6 days before it", () => {
    expect(isEditableHabitDay("2026-10-07", today)).toBe(true);
    expect(isEditableHabitDay("2026-10-01", today)).toBe(true);
  });

  it("rejects a day older than the last 7", () => {
    expect(isEditableHabitDay("2026-09-30", today)).toBe(false);
  });

  it("rejects a future day", () => {
    expect(isEditableHabitDay("2026-10-08", today)).toBe(false);
  });

  it("rejects a value that is not a day", () => {
    expect(isEditableHabitDay("", today)).toBe(false);
    expect(isEditableHabitDay("2026-10-07", "not-a-day")).toBe(false);
  });
});
