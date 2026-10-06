// Pomodoro timer rules as pure functions. Times are epoch milliseconds.
// Remaining time is always derived from `endsAt`, never from counting ticks.

import { POMODORO_CONFIG } from "@/lib/pomodoro/config";

export type Phase = "focus" | "shortBreak" | "longBreak";

// "ended" is only used for focus periods: the period is over and waits for
// the user to acknowledge it. Breaks go straight to an idle focus phase.
export type TimerStatus = "idle" | "running" | "ended";

export type TimerActivity = { id: string; name: string };

export type TimerState = {
  phase: Phase;
  status: TimerStatus;
  startedAt: number | null;
  endsAt: number | null;
  // Focus periods completed in the current cycle; back to 0 after a long break.
  completedFocusCount: number;
  // The activity of the running or ended focus period.
  activity: TimerActivity | null;
  // True from the end of a break until the next phase starts.
  breakJustEnded: boolean;
};

const PHASES: readonly Phase[] = ["focus", "shortBreak", "longBreak"];
const STATUSES: readonly TimerStatus[] = ["idle", "running", "ended"];

export function initialState(): TimerState {
  return idle("focus", 0);
}

export function phaseDurationMs(phase: Phase): number {
  const minutes = {
    focus: POMODORO_CONFIG.focusMinutes,
    shortBreak: POMODORO_CONFIG.shortBreakMinutes,
    longBreak: POMODORO_CONFIG.longBreakMinutes,
  }[phase];
  return minutes * 60_000;
}

/** Starts the waiting phase. A focus period needs an activity; breaks take none. */
export function startPhase(
  state: TimerState,
  now: number,
  activity?: TimerActivity,
): TimerState {
  if (state.status !== "idle") return state;
  if (state.phase === "focus" && !activity) return state;
  return {
    ...state,
    status: "running",
    startedAt: now,
    endsAt: now + phaseDurationMs(state.phase),
    activity: state.phase === "focus" ? (activity ?? null) : null,
    breakJustEnded: false,
  };
}

export function remainingMs(state: TimerState, now: number): number {
  if (state.status === "idle") return phaseDurationMs(state.phase);
  if (state.status === "ended" || state.endsAt === null) return 0;
  return Math.max(0, state.endsAt - now);
}

export function isFinished(state: TimerState, now: number): boolean {
  return (
    state.status === "running" && state.endsAt !== null && now >= state.endsAt
  );
}

/**
 * The phase after `phase`. `completedFocusCount` is the number of focus
 * periods completed in the cycle, including the one that just ended.
 */
export function nextPhase(phase: Phase, completedFocusCount: number): Phase {
  if (phase !== "focus") return "focus";
  return completedFocusCount >= POMODORO_CONFIG.focusPeriodsPerCycle
    ? "longBreak"
    : "shortBreak";
}

/** Applies the end of the running phase. Call it once `isFinished` is true. */
export function complete(state: TimerState): TimerState {
  if (state.status !== "running") return state;
  if (state.phase === "focus") {
    return {
      ...state,
      status: "ended",
      completedFocusCount: state.completedFocusCount + 1,
    };
  }
  const count = state.phase === "longBreak" ? 0 : state.completedFocusCount;
  return { ...idle("focus", count), breakJustEnded: true };
}

/** Moves an ended focus period on to its break, stopped and waiting for Start. */
export function acknowledge(state: TimerState): TimerState {
  if (state.status !== "ended") return state;
  return idle(
    nextPhase(state.phase, state.completedFocusCount),
    state.completedFocusCount,
  );
}

/** Abandons the running phase. Nothing is recorded. */
export function cancel(state: TimerState): TimerState {
  if (state.status !== "running") return state;
  return idle("focus", state.completedFocusCount);
}

/** Reads a state saved as JSON, or null if it is missing or not a valid state. */
export function parseStoredState(raw: string | null): TimerState | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const state = value as Record<string, unknown>;

  if (!PHASES.includes(state.phase as Phase)) return null;
  if (!STATUSES.includes(state.status as TimerStatus)) return null;
  if (!isCount(state.completedFocusCount)) return null;
  if (typeof state.breakJustEnded !== "boolean") return null;
  if (!isTimeOrNull(state.startedAt) || !isTimeOrNull(state.endsAt)) return null;
  if (state.status !== "idle" && (!state.startedAt || !state.endsAt)) return null;
  if (state.status === "ended" && state.phase !== "focus") return null;
  if (!isActivityOrNull(state.activity)) return null;
  if (state.phase === "focus" && state.status !== "idle" && !state.activity) {
    return null;
  }

  return {
    phase: state.phase as Phase,
    status: state.status as TimerStatus,
    startedAt: state.startedAt,
    endsAt: state.endsAt,
    completedFocusCount: state.completedFocusCount,
    activity: state.activity,
    breakJustEnded: state.breakJustEnded,
  };
}

function idle(phase: Phase, completedFocusCount: number): TimerState {
  return {
    phase,
    status: "idle",
    startedAt: null,
    endsAt: null,
    completedFocusCount,
    activity: null,
    breakJustEnded: false,
  };
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isTimeOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isActivityOrNull(value: unknown): value is TimerActivity | null {
  if (value === null) return true;
  if (typeof value !== "object") return false;
  const activity = value as Record<string, unknown>;
  return typeof activity.id === "string" && typeof activity.name === "string";
}

/** Formats remaining time as MM:SS, rounding a started second up. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
