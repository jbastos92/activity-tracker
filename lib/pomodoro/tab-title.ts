// The tab title as a signal that a focus period ended, for when desktop
// notifications are not available. Nothing here throws outside a browser.

const APP_NAME = "Activity Tracker";
const MARKER = "(!)";

/**
 * Puts a marker and `message` in the tab title, but only when the user is not
 * looking at the app: the tab is hidden or the window is not focused. Returns
 * a function that brings the original title back.
 */
export function showTabTitleSignal(message: string): () => void {
  try {
    if (!document.hidden && document.hasFocus()) return () => {};
    const original = document.title;
    const signal = `${MARKER} ${message} - ${APP_NAME}`;
    document.title = signal;
    return () => {
      // Opening another section sets that section's title; keep it.
      if (document.title === signal) document.title = original;
    };
  } catch {
    return () => {};
  }
}
