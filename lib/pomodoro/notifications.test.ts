import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getNotificationStatus,
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
