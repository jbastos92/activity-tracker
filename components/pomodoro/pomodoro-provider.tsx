"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import { PhaseEndedOverlay } from "@/components/pomodoro/phase-ended-overlay";
import { lastActivityStore, timerStore } from "@/lib/pomodoro/store";
import {
  type TimerActivity,
  type TimerState,
  acknowledge as acknowledgeState,
  cancel as cancelState,
  complete,
  initialState,
  isFinished,
  parseStoredState,
  startPhase,
} from "@/lib/pomodoro/timer";

type PomodoroContextValue = {
  state: TimerState;
  start: (activity?: TimerActivity) => void;
  cancel: () => void;
  acknowledge: () => void;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function readState(): TimerState {
  return parseStoredState(timerStore.read()) ?? initialState();
}

function update(change: (state: TimerState) => TimerState): void {
  const current = readState();
  const next = change(current);
  if (next !== current) timerStore.write(JSON.stringify(next));
}

// The end is decided by comparing the real time with the stored `endsAt`.
function completeIfFinished(): void {
  const current = readState();
  const now = Date.now();
  if (!isFinished(current, now) || current.endsAt === null) return;
  update(complete);
  console.info(
    `[pomodoro] ${current.phase} ended: detected at ${new Date(now).toISOString()}, ` +
      `${now - current.endsAt}ms after endsAt`,
  );
}

/** Calls `onDue` once `endsAt` has passed. Returns a function that stops it. */
function scheduleEndCheck(endsAt: number, onDue: () => void): () => void {
  try {
    const worker = new Worker(
      new URL("../../lib/pomodoro/end-timer.worker.ts", import.meta.url),
    );
    worker.onmessage = onDue;
    worker.postMessage(endsAt);
    return () => worker.terminate();
  } catch {
    // Without a worker the page timer still fires, only late in a hidden tab.
    const id = window.setTimeout(onDue, Math.max(0, endsAt - Date.now()));
    return () => window.clearTimeout(id);
  }
}

/** Runs the timer for the whole app. Mounted once, in the root layout. */
export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  // The saved state is only read on the client, after hydration.
  const raw = useSyncExternalStore(
    timerStore.subscribe,
    timerStore.read,
    () => null,
  );
  const state = useMemo(() => parseStoredState(raw) ?? initialState(), [raw]);

  const { status, endsAt } = state;
  useEffect(() => {
    if (status !== "running" || endsAt === null) return;
    // Covers a page opened after the end: the computer slept or the browser
    // was closed.
    completeIfFinished();
    const stop = scheduleEndCheck(endsAt, completeIfFinished);
    document.addEventListener("visibilitychange", completeIfFinished);
    window.addEventListener("focus", completeIfFinished);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", completeIfFinished);
      window.removeEventListener("focus", completeIfFinished);
    };
  }, [status, endsAt]);

  const start = useCallback((activity?: TimerActivity) => {
    update((current) => startPhase(current, Date.now(), activity));
    if (activity) lastActivityStore.write(activity.id);
  }, []);
  const cancel = useCallback(() => update(cancelState), []);
  const acknowledge = useCallback(() => update(acknowledgeState), []);

  const value = useMemo(
    () => ({ state, start, cancel, acknowledge }),
    [state, start, cancel, acknowledge],
  );

  return (
    <PomodoroContext.Provider value={value}>
      {children}
      <PhaseEndedOverlay state={state} onContinue={acknowledge} />
    </PomodoroContext.Provider>
  );
}

export function usePomodoroContext(): PomodoroContextValue {
  const value = useContext(PomodoroContext);
  if (!value) {
    throw new Error("usePomodoroContext must be used inside PomodoroProvider");
  }
  return value;
}
