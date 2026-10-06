// Desktop notification permission. Nothing here throws when the Notification
// API is missing or blocked.

export type NotificationStatus =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

type Listener = () => void;

const listeners = new Set<Listener>();

/** The current permission; "default" means the user has not decided yet. */
export function getNotificationStatus(): NotificationStatus {
  try {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  } catch {
    return "unsupported";
  }
}

/**
 * Shows Chrome's permission prompt, but only while permission is undecided.
 * Must be called from a user gesture such as a click. Resolves to the status
 * afterwards.
 */
export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (getNotificationStatus() !== "default") return getNotificationStatus();
  try {
    await Notification.requestPermission();
  } catch {
    // The prompt could not be shown; the status below says what holds now.
  }
  listeners.forEach((listener) => listener());
  return getNotificationStatus();
}

/** For `useSyncExternalStore`: calls `listener` when the status may have changed. */
export function subscribeToNotificationStatus(listener: Listener): () => void {
  listeners.add(listener);
  // The permission can also change in Chrome's site settings; the user is
  // away from the page while doing that, so check again on return.
  const hasWindow = typeof window !== "undefined";
  if (hasWindow) window.addEventListener("focus", listener);
  return () => {
    listeners.delete(listener);
    if (hasWindow) window.removeEventListener("focus", listener);
  };
}
