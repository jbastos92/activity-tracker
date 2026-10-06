import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins class names and skips falsy values", () => {
    expect(cn("px-2", false, undefined, "font-medium")).toBe(
      "px-2 font-medium",
    );
  });

  it("lets a later Tailwind class override an earlier one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
