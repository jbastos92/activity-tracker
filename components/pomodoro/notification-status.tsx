"use client";

import { useSyncExternalStore } from "react";

import {
  getNotificationStatus,
  subscribeToNotificationStatus,
} from "@/lib/pomodoro/notifications";

/** A note shown only when desktop notifications are denied or unavailable. */
export function NotificationStatus() {
  const status = useSyncExternalStore(
    subscribeToNotificationStatus,
    getNotificationStatus,
    // Not known before hydration; "default" renders nothing.
    () => "default" as const,
  );

  if (status === "granted" || status === "default") return null;

  return (
    <p className="max-w-sm text-sm text-muted-foreground">
      {status === "denied"
        ? "Desktop notifications are off. The tab title will signal the end of a focus period instead. You can turn them on in Chrome's site settings."
        : "Desktop notifications are not available in this browser. The tab title will signal the end of a focus period instead."}
    </p>
  );
}
