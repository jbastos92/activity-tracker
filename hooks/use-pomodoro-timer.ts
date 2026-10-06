"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import { clock, lastActivityStore, timerStore } from "@/lib/pomodoro/store";
import {
  type TimerActivity,
  type TimerState,
  acknowledge as acknowledgeState,
  cancel as cancelState,
  complete,
  initialState,
  isFinished,
  parseStoredState,
  remainingMs,
  startPhase,
} from "@/lib/pomodoro/timer";

function readState(): TimerState {
  return parseStoredState(timerStore.read()) ?? initialState();
}

function update(change: (state: TimerState) => TimerState): void {
  const current = readState();
  const next = change(current);
  if (next !== current) timerStore.write(JSON.stringify(next));
}

export function usePomodoroTimer() {
  // The saved state is only read on the client, after hydration.
  const raw = useSyncExternalStore(
    timerStore.subscribe,
    timerStore.read,
    () => null,
  );
  const state = useMemo(() => parseStoredState(raw) ?? initialState(), [raw]);
  const now = useSyncExternalStore(
    clock.subscribe,
    clock.read,
    clock.readOnServer,
  );

  // The end is decided by comparing the real time with the stored `endsAt`.
  useEffect(() => {
    if (isFinished(state, Date.now())) update(complete);
  }, [state, now]);

  const start = useCallback((activity?: TimerActivity) => {
    update((current) => startPhase(current, Date.now(), activity));
    if (activity) lastActivityStore.write(activity.id);
  }, []);
  const cancel = useCallback(() => update(cancelState), []);
  const acknowledge = useCallback(() => update(acknowledgeState), []);

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
