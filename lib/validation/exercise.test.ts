import { describe, expect, it } from "vitest";

import {
  EXERCISE_ACTIVITY_MAX,
  EXERCISE_DURATION_MAX,
  EXERCISE_NOTES_MAX,
  exerciseEntrySchema,
} from "@/lib/validation/exercise";

const today = "2026-10-07";
const schema = exerciseEntrySchema(today);
const valid = {
  date: "2026-10-06",
  activity: "Running",
  durationMinutes: 30,
  notes: "Easy pace",
};

function messageFor(input: unknown, field: string): string | undefined {
  const result = schema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("exerciseEntrySchema", () => {
  it("accepts a valid entry", () => {
    expect(schema.parse(valid)).toEqual(valid);
  });

  describe("activity", () => {
    it("is trimmed", () => {
      expect(schema.parse({ ...valid, activity: "  Running  " }).activity).toBe("Running");
    });

    it("rejects a blank value", () => {
      expect(messageFor({ ...valid, activity: "" }, "activity")).toBe("Enter an activity.");
      expect(messageFor({ ...valid, activity: "   " }, "activity")).toBe("Enter an activity.");
    });

    it("accepts 80 characters and rejects 81", () => {
      const ok = { ...valid, activity: "a".repeat(EXERCISE_ACTIVITY_MAX) };
      const tooLong = { ...valid, activity: "a".repeat(EXERCISE_ACTIVITY_MAX + 1) };
      expect(schema.safeParse(ok).success).toBe(true);
      expect(messageFor(tooLong, "activity")).toBe("Use 80 characters or fewer.");
    });

    it("rejects a value that is not text", () => {
      expect(messageFor({ ...valid, activity: null }, "activity")).toBe("Enter an activity.");
    });
  });

  describe("durationMinutes", () => {
    it("accepts 1 and 1440", () => {
      expect(schema.parse({ ...valid, durationMinutes: 1 }).durationMinutes).toBe(1);
      expect(
        schema.parse({ ...valid, durationMinutes: EXERCISE_DURATION_MAX }).durationMinutes,
      ).toBe(1440);
    });

    it("rejects 0, a negative number and 1441", () => {
      const message = "Enter a duration from 1 to 1440 minutes.";
      expect(messageFor({ ...valid, durationMinutes: 0 }, "durationMinutes")).toBe(message);
      expect(messageFor({ ...valid, durationMinutes: -5 }, "durationMinutes")).toBe(message);
      expect(messageFor({ ...valid, durationMinutes: 1441 }, "durationMinutes")).toBe(message);
    });

    it("rejects a number that is not whole", () => {
      expect(messageFor({ ...valid, durationMinutes: 12.5 }, "durationMinutes")).toBe(
        "Use whole minutes.",
      );
    });

    it("accepts a number typed as text, as a form sends it", () => {
      expect(schema.parse({ ...valid, durationMinutes: " 45 " }).durationMinutes).toBe(45);
    });

    it("rejects text that is not a number, and a missing value", () => {
      const message = "Enter the duration in minutes.";
      expect(messageFor({ ...valid, durationMinutes: "abc" }, "durationMinutes")).toBe(message);
      expect(messageFor({ ...valid, durationMinutes: "" }, "durationMinutes")).toBe(message);
      expect(messageFor({ ...valid, durationMinutes: undefined }, "durationMinutes")).toBe(
        message,
      );
    });

    it("rejects whole-looking text that is not whole", () => {
      expect(messageFor({ ...valid, durationMinutes: "12.5" }, "durationMinutes")).toBe(
        "Use whole minutes.",
      );
    });
  });

  describe("date", () => {
    it("accepts today and a past day", () => {
      expect(schema.safeParse({ ...valid, date: today }).success).toBe(true);
      expect(schema.safeParse({ ...valid, date: "2020-02-29" }).success).toBe(true);
    });

    it("rejects a day after today", () => {
      expect(messageFor({ ...valid, date: "2026-10-08" }, "date")).toBe(
        "The date cannot be in the future.",
      );
    });

    it("rejects a value that is not a real YYYY-MM-DD day", () => {
      for (const date of ["", "2026-02-30", "06/10/2026", "2026-10-6", null]) {
        expect(messageFor({ ...valid, date }, "date")).toBe("Enter a valid date.");
      }
    });
  });

  describe("notes", () => {
    it("are optional: missing, null or blank become null", () => {
      expect(schema.parse({ ...valid, notes: undefined }).notes).toBeNull();
      expect(schema.parse({ ...valid, notes: null }).notes).toBeNull();
      expect(schema.parse({ ...valid, notes: "   " }).notes).toBeNull();
    });

    it("are trimmed", () => {
      expect(schema.parse({ ...valid, notes: "  Felt good  " }).notes).toBe("Felt good");
    });

    it("accept 500 characters and reject 501", () => {
      const ok = { ...valid, notes: "a".repeat(EXERCISE_NOTES_MAX) };
      const tooLong = { ...valid, notes: "a".repeat(EXERCISE_NOTES_MAX + 1) };
      expect(schema.safeParse(ok).success).toBe(true);
      expect(messageFor(tooLong, "notes")).toBe("Use 500 characters or fewer.");
    });
  });

  it("reports every invalid field at once", () => {
    const result = schema.safeParse({ date: "", activity: "", durationMinutes: "", notes: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = new Set(result.error.issues.map((issue) => issue.path[0]));
      expect(fields).toEqual(new Set(["date", "activity", "durationMinutes"]));
    }
  });
});
