import { describe, expect, it } from "vitest";

import {
  EXERCISE_LIST_LIMIT,
  formatDuration,
  groupEntriesByDate,
} from "@/lib/exercise/list";

function entry(id: string, date: string) {
  return { id, date, activity: `Activity ${id}`, durationMinutes: 30, notes: null };
}

describe("groupEntriesByDate", () => {
  it("puts entries of the same date under one heading, keeping their order", () => {
    const groups = groupEntriesByDate([
      entry("c", "2026-10-07"),
      entry("b", "2026-10-07"),
      entry("a", "2026-10-05"),
    ]);
    expect(groups.map((group) => [group.date, group.entries.map((e) => e.id)])).toEqual([
      ["2026-10-07", ["c", "b"]],
      ["2026-10-05", ["a"]],
    ]);
  });

  it("gives each group a readable date label", () => {
    const groups = groupEntriesByDate([
      entry("b", "2026-10-07"),
      entry("a", "2025-12-31"),
    ]);
    expect(groups.map((group) => group.label)).toEqual([
      "Wed 7 Oct 2026",
      "Wed 31 Dec 2025",
    ]);
  });

  it("returns no groups for no entries", () => {
    expect(groupEntriesByDate([])).toEqual([]);
  });

  it("falls back to the stored text when a date is not a real day", () => {
    expect(groupEntriesByDate([entry("a", "not-a-day")])[0].label).toBe("not-a-day");
  });
});

describe("formatDuration", () => {
  it("uses the singular for one minute", () => {
    expect(formatDuration(1)).toBe("1 minute");
  });

  it("uses the plural otherwise", () => {
    expect(formatDuration(45)).toBe("45 minutes");
    expect(formatDuration(1440)).toBe("1440 minutes");
  });
});

describe("EXERCISE_LIST_LIMIT", () => {
  it("is 50 (A-13)", () => {
    expect(EXERCISE_LIST_LIMIT).toBe(50);
  });
});
