import { describe, expect, it } from "vitest";

import {
  focusEndedMessage,
  focusEndedTitle,
  nextBreakText,
} from "@/lib/pomodoro/messages";

describe("end-of-focus messages", () => {
  it("names the activity", () => {
    expect(focusEndedTitle("Read")).toBe("Focus time is over: Read");
  });

  it("announces a short break after the 1st, 2nd and 3rd focus periods", () => {
    for (const count of [1, 2, 3]) {
      expect(nextBreakText(count)).toBe("Next: short break (5 minutes)");
    }
  });

  it("announces a long break after the 4th focus period", () => {
    expect(nextBreakText(4)).toBe("Next: long break (15 minutes)");
  });

  it("joins both parts into one line", () => {
    expect(focusEndedMessage("Read", 1)).toBe(
      "Focus time is over: Read. Next: short break (5 minutes)",
    );
  });
});
