import { afterEach, describe, expect, it, vi } from "vitest";

import {
  closeFocusEndedNotification,
  getNotificationStatus,
  notifyFocusEnded,
  requestNotificationPermission,
  subscribeToNotificationStatus,
} from "@/lib/pomodoro/notifications";

/** A stand-in for Chrome's Notification global; `answer` is what the user picks. */
function stubNotification(
  permission: NotificationPermission,
  answer: NotificationPermission = permission,
) {
  const fake = {
    permission,
    requestPermission: vi.fn(async () => {
      fake.permission = answer;
      return answer;
    }),
  };
  vi.stubGlobal("Notification", fake);
  return fake;
}

type ShownNotification = {
  title: string;
  options?: NotificationOptions;
  onclick: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
};

/**
 * A stand-in for the page at the end of a focus period: the permission, and
 * whether the tab is hidden and the window focused. `shown` collects every
 * notification created.
 */
function stubPage({
  permission = "granted",
  hidden,
  focused,
}: {
  permission?: NotificationPermission;
  hidden: boolean;
  focused: boolean;
}) {
  const shown: ShownNotification[] = [];
  class FakeNotification {
    static permission = permission;
    onclick: (() => void) | null = null;
    close = vi.fn();
    constructor(
      public title: string,
      public options?: NotificationOptions,
    ) {
      shown.push(this);
    }
  }
  const focusWindow = vi.fn();
  vi.stubGlobal("Notification", FakeNotification);
  vi.stubGlobal("document", { hidden, hasFocus: () => focused });
  vi.stubGlobal("window", { focus: focusWindow });
  return { shown, focusWindow };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getNotificationStatus", () => {
  it("is unsupported when the Notification API is missing", () => {
    expect(getNotificationStatus()).toBe("unsupported");
  });

  it.each(["granted", "denied", "default"] as const)(
    "reports the browser permission %s",
    (permission) => {
      stubNotification(permission);
      expect(getNotificationStatus()).toBe(permission);
    },
  );
});

describe("requestNotificationPermission", () => {
  it("resolves to unsupported when the Notification API is missing", async () => {
    await expect(requestNotificationPermission()).resolves.toBe("unsupported");
  });

  it("prompts while permission is undecided and returns the answer", async () => {
    const fake = stubNotification("default", "granted");

    await expect(requestNotificationPermission()).resolves.toBe("granted");
    expect(fake.requestPermission).toHaveBeenCalledTimes(1);
  });

  it.each(["granted", "denied"] as const)(
    "does not prompt again once permission is %s",
    async (permission) => {
      const fake = stubNotification(permission);

      await expect(requestNotificationPermission()).resolves.toBe(permission);
      expect(fake.requestPermission).not.toHaveBeenCalled();
    },
  );

  it("does not throw when the prompt fails", async () => {
    const fake = stubNotification("default");
    fake.requestPermission.mockRejectedValue(new Error("blocked"));

    await expect(requestNotificationPermission()).resolves.toBe("default");
  });

  it("tells subscribers once the prompt is answered", async () => {
    stubNotification("default", "denied");
    const listener = vi.fn();
    const unsubscribe = subscribeToNotificationStatus(listener);

    await requestNotificationPermission();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await requestNotificationPermission();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("notifyFocusEnded", () => {
  it("shows the message when the tab is hidden", () => {
    const { shown } = stubPage({ hidden: true, focused: false });

    expect(notifyFocusEnded("Focus time is over: Read", "Next: short break")).toBe(true);
    expect(shown).toHaveLength(1);
    expect(shown[0].title).toBe("Focus time is over: Read");
    expect(shown[0].options?.body).toBe("Next: short break");
  });

  it("shows the message when the tab is visible but the window is not focused", () => {
    const { shown } = stubPage({ hidden: false, focused: false });

    expect(notifyFocusEnded("Focus time is over: Read", "Next: short break")).toBe(true);
    expect(shown).toHaveLength(1);
  });

  it("shows nothing when the tab is visible and focused", () => {
    const { shown } = stubPage({ hidden: false, focused: true });

    expect(notifyFocusEnded("Focus time is over: Read", "Next: short break")).toBe(false);
    expect(shown).toHaveLength(0);
  });

  it.each(["denied", "default"] as const)(
    "shows nothing while permission is %s",
    (permission) => {
      const { shown } = stubPage({ permission, hidden: true, focused: false });

      expect(notifyFocusEnded("Focus time is over: Read", "Next: short break")).toBe(false);
      expect(shown).toHaveLength(0);
    },
  );

  it("returns false when the Notification API is missing", () => {
    expect(notifyFocusEnded("Focus time is over: Read", "Next: short break")).toBe(false);
  });

  it("does not throw when the notification cannot be created", () => {
    stubPage({ hidden: true, focused: false });
    vi.stubGlobal(
      "Notification",
      class {
        static permission = "granted";
        constructor() {
          throw new TypeError("Illegal constructor");
        }
      },
    );

    expect(notifyFocusEnded("Focus time is over: Read", "Next: short break")).toBe(false);
  });

  it("brings the window to the front and closes the notification on click", () => {
    const { shown, focusWindow } = stubPage({ hidden: true, focused: false });
    notifyFocusEnded("Focus time is over: Read", "Next: short break");
    expect(focusWindow).not.toHaveBeenCalled();

    shown[0].onclick?.();

    expect(focusWindow).toHaveBeenCalledTimes(1);
    expect(shown[0].close).toHaveBeenCalledTimes(1);
  });

  it("uses one tag, so a second tab replaces the notification instead of adding one", () => {
    const { shown } = stubPage({ hidden: true, focused: false });

    notifyFocusEnded("Focus time is over: Read", "Next: short break");
    notifyFocusEnded("Focus time is over: Write", "Next: long break");

    expect(shown[0].options?.tag).toBeTruthy();
    expect(shown[1].options?.tag).toBe(shown[0].options?.tag);
  });
});

describe("a shown focus-ended notification", () => {
  it("stays on screen until the user acts on it", () => {
    const { shown } = stubPage({ hidden: true, focused: false });

    notifyFocusEnded("Focus time is over: Read", "Next: short break");

    expect(shown[0].options?.requireInteraction).toBe(true);
  });

  it("is closed by closeFocusEndedNotification", () => {
    const { shown } = stubPage({ hidden: true, focused: false });
    notifyFocusEnded("Focus time is over: Read", "Next: short break");
    expect(shown[0].close).not.toHaveBeenCalled();

    closeFocusEndedNotification();

    expect(shown[0].close).toHaveBeenCalledTimes(1);
  });

  it("is closed only once", () => {
    const { shown } = stubPage({ hidden: true, focused: false });
    notifyFocusEnded("Focus time is over: Read", "Next: short break");

    closeFocusEndedNotification();
    closeFocusEndedNotification();

    expect(shown[0].close).toHaveBeenCalledTimes(1);
  });
});
