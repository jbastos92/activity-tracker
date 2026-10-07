import { describe, expect, it } from "vitest";

import {
  HABIT_NAME_MAX,
  habitCompletionSchema,
  habitNameSchema,
} from "@/lib/validation/habits";

describe("habitNameSchema", () => {
  it("accepts a name and trims it", () => {
    expect(habitNameSchema.parse("  Meditate  ")).toBe("Meditate");
  });

  it("rejects a blank name", () => {
    expect(habitNameSchema.safeParse("").success).toBe(false);
    expect(habitNameSchema.safeParse("    ").success).toBe(false);
  });

  it("accepts 80 characters and rejects 81", () => {
    expect(habitNameSchema.safeParse("a".repeat(HABIT_NAME_MAX)).success).toBe(true);
    expect(habitNameSchema.safeParse("a".repeat(HABIT_NAME_MAX + 1)).success).toBe(false);
  });

  it("counts length after trimming", () => {
    const padded = `  ${"a".repeat(HABIT_NAME_MAX)}  `;
    expect(habitNameSchema.safeParse(padded).success).toBe(true);
  });

  it("gives a readable message", () => {
    const result = habitNameSchema.safeParse(" ");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Enter a name.");
    }
  });

  it("rejects values that are not text", () => {
    expect(habitNameSchema.safeParse(null).success).toBe(false);
    expect(habitNameSchema.safeParse(42).success).toBe(false);
  });
});

describe("habitCompletionSchema", () => {
  const valid = { habitId: "habit-1", date: "2026-10-06", done: true };

  it("accepts a habit, a day and a done flag", () => {
    expect(habitCompletionSchema.parse(valid)).toEqual(valid);
    expect(habitCompletionSchema.parse({ ...valid, done: false }).done).toBe(false);
  });

  it("rejects a missing habit id", () => {
    expect(habitCompletionSchema.safeParse({ ...valid, habitId: "" }).success).toBe(false);
  });

  it("rejects a date that is not a real YYYY-MM-DD day", () => {
    for (const date of ["2026-02-30", "06/10/2026", "2026-10-6", ""]) {
      expect(habitCompletionSchema.safeParse({ ...valid, date }).success).toBe(false);
    }
  });

  it("rejects a done value that is not a boolean", () => {
    expect(habitCompletionSchema.safeParse({ ...valid, done: "true" }).success).toBe(false);
    expect(habitCompletionSchema.safeParse({ ...valid, done: undefined }).success).toBe(false);
  });
});
