// Desktop notifications: the permission, and the notification for the end of
// a focus period. Nothing here throws when the Notification API is missing or
// blocked.

export type NotificationStatus =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

type Listener = () => void;

// Every tab uses the same tag, so Chrome keeps a single notification visible.
const FOCUS_ENDED_TAG = "pomodoro-focus-ended";

// The notification this tab is showing, kept so it can be closed again.
let focusEndedNotification: Notification | null = null;

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

/**
 * Shows a desktop notification for the end of a focus period, but only when
 * permission is granted and the user is not looking at the app: the tab is
 * hidden or the window is not focused. It stays on screen until the user acts
 * on it. Clicking it brings the tab to the front; a page cannot do that by
 * itself. Returns whether it was shown.
 */
export function notifyFocusEnded(title: string, body: string): boolean {
  if (getNotificationStatus() !== "granted") return false;
  try {
    if (!document.hidden && document.hasFocus()) return false;
    const notification = new Notification(title, {
      body,
      tag: FOCUS_ENDED_TAG,
      requireInteraction: true,
    });
    notification.onclick = () => {
      window.focus();
      closeFocusEndedNotification();
    };
    focusEndedNotification = notification;
    return true;
  } catch {
    return false;
  }
}

/** Takes the notification off the screen, once the user has seen the message. */
export function closeFocusEndedNotification(): void {
  const notification = focusEndedNotification;
  focusEndedNotification = null;
  try {
    notification?.close();
  } catch {
    // Already gone.
  }
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
