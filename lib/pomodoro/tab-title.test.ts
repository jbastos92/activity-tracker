import { afterEach, describe, expect, it, vi } from "vitest";

import { showTabTitleSignal } from "@/lib/pomodoro/tab-title";

/** A stand-in for the page: its title, and whether the user is looking at it. */
function stubPage({ hidden, focused }: { hidden: boolean; focused: boolean }) {
  const page = {
    title: "Habits - Activity Tracker",
    hidden,
    hasFocus: () => focused,
  };
  vi.stubGlobal("document", page);
  return page;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("showTabTitleSignal", () => {
  it("puts a marker and the message in the title when the tab is hidden", () => {
    const page = stubPage({ hidden: true, focused: false });

    showTabTitleSignal("Focus time is over: Read");

    expect(page.title).toBe("(!) Focus time is over: Read - Activity Tracker");
  });

  it("does the same when the tab is visible but the window is not focused", () => {
    const page = stubPage({ hidden: false, focused: false });

    showTabTitleSignal("Focus time is over: Read");

    expect(page.title).toBe("(!) Focus time is over: Read - Activity Tracker");
  });

  it("leaves the title alone when the tab is visible and focused", () => {
    const page = stubPage({ hidden: false, focused: true });

    showTabTitleSignal("Focus time is over: Read");

    expect(page.title).toBe("Habits - Activity Tracker");
  });

  it("returns a function that brings the original title back", () => {
    const page = stubPage({ hidden: true, focused: false });

    const clear = showTabTitleSignal("Focus time is over: Read");
    clear();

    expect(page.title).toBe("Habits - Activity Tracker");
  });

  it("keeps the title of a section opened while the marker was set", () => {
    const page = stubPage({ hidden: true, focused: false });
    const clear = showTabTitleSignal("Focus time is over: Read");

    page.title = "Exercise - Activity Tracker";
    clear();

    expect(page.title).toBe("Exercise - Activity Tracker");
  });

  it("does not throw where there is no page", () => {
    expect(() => showTabTitleSignal("Focus time is over: Read")()).not.toThrow();
  });
});
