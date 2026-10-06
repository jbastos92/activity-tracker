import { describe, expect, it } from "vitest";

import {
  ACTIVITY_NAME_MAX,
  activityNameSchema,
  toNameKey,
} from "@/lib/validation/activities";

describe("activityNameSchema", () => {
  it("accepts a name and trims it", () => {
    expect(activityNameSchema.parse("  Read  ")).toBe("Read");
  });

  it("rejects a blank name", () => {
    expect(activityNameSchema.safeParse("").success).toBe(false);
    expect(activityNameSchema.safeParse("    ").success).toBe(false);
  });

  it("accepts 60 characters and rejects 61", () => {
    expect(activityNameSchema.safeParse("a".repeat(ACTIVITY_NAME_MAX)).success).toBe(true);
    expect(activityNameSchema.safeParse("a".repeat(ACTIVITY_NAME_MAX + 1)).success).toBe(false);
  });

  it("counts length after trimming", () => {
    const padded = `  ${"a".repeat(ACTIVITY_NAME_MAX)}  `;
    expect(activityNameSchema.safeParse(padded).success).toBe(true);
  });

  it("gives a readable message", () => {
    const result = activityNameSchema.safeParse(" ");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Enter a name.");
    }
  });

  it("rejects values that are not text", () => {
    expect(activityNameSchema.safeParse(null).success).toBe(false);
    expect(activityNameSchema.safeParse(42).success).toBe(false);
  });
});

describe("toNameKey", () => {
  it("makes names that differ only in case or outer spaces equal", () => {
    expect(toNameKey("Read")).toBe("read");
    expect(toNameKey("  READ ")).toBe("read");
    expect(toNameKey("read")).toBe(toNameKey("Read"));
  });

  it("keeps different names different", () => {
    expect(toNameKey("Read")).not.toBe(toNameKey("Reading"));
  });
});
