// Texts announcing the end of a focus period. The overlay, the desktop
// notification and the tab title all use these.

import { POMODORO_CONFIG } from "@/lib/pomodoro/config";
import { nextPhase } from "@/lib/pomodoro/timer";

/** For example "Focus time is over: Read". */
export function focusEndedTitle(activityName: string): string {
  return `Focus time is over: ${activityName}`;
}

/**
 * For example "Next: short break (5 minutes)". `completedFocusCount` includes
 * the focus period that just ended.
 */
export function nextBreakText(completedFocusCount: number): string {
  return nextPhase("focus", completedFocusCount) === "longBreak"
    ? `Next: long break (${POMODORO_CONFIG.longBreakMinutes} minutes)`
    : `Next: short break (${POMODORO_CONFIG.shortBreakMinutes} minutes)`;
}

/** The whole message on one line, for places with a single text. */
export function focusEndedMessage(
  activityName: string,
  completedFocusCount: number,
): string {
  return `${focusEndedTitle(activityName)}. ${nextBreakText(completedFocusCount)}`;
}
