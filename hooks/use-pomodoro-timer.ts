"use client";

import { useSyncExternalStore } from "react";

import { usePomodoroContext } from "@/components/pomodoro/pomodoro-provider";
import { clock, lastActivityStore } from "@/lib/pomodoro/store";
import { remainingMs } from "@/lib/pomodoro/timer";

/** The app-wide timer (see `PomodoroProvider`) with a ticking countdown. */
export function usePomodoroTimer() {
  const { state, start, cancel, acknowledge } = usePomodoroContext();
  const now = useSyncExternalStore(
    clock.subscribe,
    clock.read,
    clock.readOnServer,
  );

  return {
    phase: state.phase,
    status: state.status,
    isRunning: state.status === "running",
    remainingMs: remainingMs(state, now),
    completedFocusCount: state.completedFocusCount,
    activity: state.activity,
    breakJustEnded: state.breakJustEnded,
    start,
    cancel,
    acknowledge,
  };
}

/** The id of the activity used last time, or null. */
export function useLastActivityId(): string | null {
  return useSyncExternalStore(
    lastActivityStore.subscribe,
    lastActivityStore.read,
    () => null,
  );
}
