"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import { recordCompletedFocusAction } from "@/app/pomodoro/actions";
import { PhaseEndedOverlay } from "@/components/pomodoro/phase-ended-overlay";
import { focusEndedTitle, nextBreakText } from "@/lib/pomodoro/messages";
import {
  closeFocusEndedNotification,
  getNotificationStatus,
  notifyFocusEnded,
} from "@/lib/pomodoro/notifications";
import {
  lastActivityStore,
  saveFailureStore,
  timerStore,
  unsavedFocusStore,
} from "@/lib/pomodoro/store";
import { showTabTitleSignal } from "@/lib/pomodoro/tab-title";
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
import {
  type UnsavedFocus,
  addUnsaved,
  parseUnsaved,
  removeUnsaved,
  toUnsavedFocus,
} from "@/lib/pomodoro/unsaved";

type PomodoroContextValue = {
  state: TimerState;
  start: (activity?: TimerActivity) => void;
  cancel: () => void;
  acknowledge: () => void;
  // Set while a completed Pomodoro could not be saved.
  saveError: string | null;
  retrySave: () => void;
};

const SAVE_FAILED = "This Pomodoro could not be saved. Check that the app is running and try again.";

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function readState(): TimerState {
  return parseStoredState(timerStore.read()) ?? initialState();
}

function update(change: (state: TimerState) => TimerState): void {
  const current = readState();
  const next = change(current);
  if (next !== current) timerStore.write(JSON.stringify(next));
}

function readUnsaved(): UnsavedFocus[] {
  return parseUnsaved(unsavedFocusStore.read());
}

function writeUnsaved(list: UnsavedFocus[]): void {
  unsavedFocusStore.write(list.length > 0 ? JSON.stringify(list) : null);
}

// The end is decided by comparing the real time with the stored `endsAt`.
function completeIfFinished(): void {
  const current = readState();
  const now = Date.now();
  if (!isFinished(current, now) || current.endsAt === null) return;
  // Listed before anything else, so a finished Pomodoro is kept even if the
  // page goes away before it reaches the database.
  const finished = toUnsavedFocus(
    current,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  if (finished) writeUnsaved(addUnsaved(readUnsaved(), finished));
  update(complete);
  // Only a focus period leaves an "ended" state behind; a break ends silently.
  // A second tab finds the state already "ended" above and gets no further.
  const ended = readState();
  if (ended.status === "ended" && ended.activity) {
    notifyFocusEnded(
      focusEndedTitle(ended.activity.name),
      nextBreakText(ended.completedFocusCount),
    );
  }
  console.info(
    `[pomodoro] ${current.phase} ended: detected at ${new Date(now).toISOString()}, ` +
      `${now - current.endsAt}ms after endsAt`,
  );
}

let saving = false;

/**
 * Sends every listed Pomodoro to the database, oldest first, and takes each
 * one off the list once it is saved. Stops at the first failure.
 */
async function saveUnsaved(): Promise<void> {
  if (saving) return;
  saving = true;
  try {
    // Read again each time round: a Pomodoro may be listed, here or in
    // another tab, while one is being saved.
    for (;;) {
      const [focus] = readUnsaved();
      if (!focus) break;
      const result = await recordCompletedFocusAction(focus);
      if (!result.ok) {
        saveFailureStore.write(result.error);
        return;
      }
      writeUnsaved(removeUnsaved(readUnsaved(), focus.startedAt));
    }
    saveFailureStore.write(null);
  } catch {
    saveFailureStore.write(SAVE_FAILED);
  } finally {
    saving = false;
  }
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

  // Once the message is acknowledged, in this tab or another, the
  // notification has nothing left to say.
  useEffect(() => {
    if (status !== "ended") closeFocusEndedNotification();
  }, [status]);

  // Without desktop notifications the tab title carries the message instead,
  // until the message is acknowledged.
  const endedActivityName = status === "ended" ? state.activity?.name : undefined;
  useEffect(() => {
    if (endedActivityName === undefined) return;
    if (getNotificationStatus() === "granted") return;
    return showTabTitleSignal(focusEndedTitle(endedActivityName));
  }, [endedActivityName]);

  // Completed Pomodoros waiting to be saved. A new one, or one left over
  // from an earlier visit, is saved straight away; after a failure the list
  // is unchanged, so nothing is tried again until Retry.
  const unsavedRaw = useSyncExternalStore(
    unsavedFocusStore.subscribe,
    unsavedFocusStore.read,
    () => null,
  );
  const saveFailure = useSyncExternalStore(
    saveFailureStore.subscribe,
    saveFailureStore.read,
    () => null,
  );
  useEffect(() => {
    if (unsavedRaw !== null) void saveUnsaved();
  }, [unsavedRaw]);
  // Another tab may have saved it in the meantime.
  const saveError = unsavedRaw === null ? null : saveFailure;

  const start = useCallback((activity?: TimerActivity) => {
    update((current) => startPhase(current, Date.now(), activity));
    if (activity) lastActivityStore.write(activity.id);
  }, []);
  const cancel = useCallback(() => update(cancelState), []);
  const acknowledge = useCallback(() => update(acknowledgeState), []);

  const value = useMemo(
    () => ({
      state,
      start,
      cancel,
      acknowledge,
      saveError,
      retrySave: saveUnsaved,
    }),
    [state, start, cancel, acknowledge, saveError],
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
