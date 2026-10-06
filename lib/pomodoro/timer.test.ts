import { describe, expect, it } from "vitest";

import {
  type TimerState,
  acknowledge,
  cancel,
  complete,
  formatCountdown,
  initialState,
  isFinished,
  nextPhase,
  parseStoredState,
  phaseDurationMs,
  remainingMs,
  startPhase,
} from "@/lib/pomodoro/timer";

const MINUTE = 60_000;
const T0 = Date.UTC(2026, 9, 5, 12, 0, 0);
const read = { id: "a1", name: "Read" };

/** Runs one full focus period and the break after it. */
function focusThenBreak(state: TimerState, now: number): TimerState {
  let next = startPhase(state, now, read);
  next = complete(next);
  next = acknowledge(next);
  next = startPhase(next, now);
  return complete(next);
}

describe("phaseDurationMs", () => {
  it("uses 25, 5 and 15 minutes", () => {
    expect(phaseDurationMs("focus")).toBe(25 * MINUTE);
    expect(phaseDurationMs("shortBreak")).toBe(5 * MINUTE);
    expect(phaseDurationMs("longBreak")).toBe(15 * MINUTE);
  });
});

describe("startPhase", () => {
  it("starts an idle focus phase with its end time and activity", () => {
    const state = startPhase(initialState(), T0, read);
    expect(state).toMatchObject({
      phase: "focus",
      status: "running",
      startedAt: T0,
      endsAt: T0 + 25 * MINUTE,
      activity: read,
    });
  });

  it("does not start a focus phase without an activity", () => {
    expect(startPhase(initialState(), T0)).toEqual(initialState());
  });

  it("does not restart a phase that is already running", () => {
    const running = startPhase(initialState(), T0, read);
    expect(startPhase(running, T0 + MINUTE, read)).toBe(running);
  });
});

describe("remainingMs and isFinished", () => {
  const running = startPhase(initialState(), T0, read);

  it("is the full duration while idle", () => {
    expect(remainingMs(initialState(), T0)).toBe(25 * MINUTE);
  });

  it("is derived from endsAt at the start, midway and after the end", () => {
    expect(remainingMs(running, T0)).toBe(25 * MINUTE);
    expect(remainingMs(running, T0 + 10 * MINUTE)).toBe(15 * MINUTE);
    expect(remainingMs(running, T0 + 25 * MINUTE)).toBe(0);
    expect(remainingMs(running, T0 + 3 * 60 * MINUTE)).toBe(0);
  });

  it("reports finished only once endsAt has passed", () => {
    expect(isFinished(running, T0 + 25 * MINUTE - 1)).toBe(false);
    expect(isFinished(running, T0 + 25 * MINUTE)).toBe(true);
    expect(isFinished(initialState(), T0 + 99 * MINUTE)).toBe(false);
  });

  it("is zero once a focus period has ended", () => {
    expect(remainingMs(complete(running), T0)).toBe(0);
  });
});

describe("nextPhase", () => {
  it("gives a short break after the 1st, 2nd and 3rd focus periods", () => {
    expect(nextPhase("focus", 1)).toBe("shortBreak");
    expect(nextPhase("focus", 2)).toBe("shortBreak");
    expect(nextPhase("focus", 3)).toBe("shortBreak");
  });

  it("gives a long break after the 4th focus period", () => {
    expect(nextPhase("focus", 4)).toBe("longBreak");
  });

  it("goes back to focus after any break", () => {
    expect(nextPhase("shortBreak", 1)).toBe("focus");
    expect(nextPhase("longBreak", 4)).toBe("focus");
  });
});

describe("focus period transitions", () => {
  it("goes running, ended, then acknowledged into a waiting break", () => {
    const running = startPhase(initialState(), T0, read);
    const ended = complete(running);
    expect(ended).toMatchObject({
      phase: "focus",
      status: "ended",
      completedFocusCount: 1,
      activity: read,
      endsAt: T0 + 25 * MINUTE,
    });

    const waiting = acknowledge(ended);
    expect(waiting).toMatchObject({
      phase: "shortBreak",
      status: "idle",
      startedAt: null,
      endsAt: null,
      completedFocusCount: 1,
    });
  });

  it("ignores acknowledge unless a focus period has ended", () => {
    const running = startPhase(initialState(), T0, read);
    expect(acknowledge(running)).toBe(running);
    expect(acknowledge(initialState())).toEqual(initialState());
  });
});

describe("break transitions", () => {
  it("moves straight to an idle focus phase when a break ends", () => {
    let state = acknowledge(complete(startPhase(initialState(), T0, read)));
    state = startPhase(state, T0);
    expect(state).toMatchObject({ phase: "shortBreak", status: "running" });

    const after = complete(state);
    expect(after).toMatchObject({
      phase: "focus",
      status: "idle",
      breakJustEnded: true,
      completedFocusCount: 1,
    });
  });

  it("clears the break-is-over note when the next focus period starts", () => {
    const afterBreak = focusThenBreak(initialState(), T0);
    expect(startPhase(afterBreak, T0, read).breakJustEnded).toBe(false);
  });
});

describe("a full cycle", () => {
  it("runs focus and short break three times, then focus and a long break", () => {
    let state = initialState();
    const breaks: string[] = [];
    for (let round = 0; round < 4; round++) {
      state = acknowledge(complete(startPhase(state, T0, read)));
      breaks.push(state.phase);
      state = complete(startPhase(state, T0));
    }
    expect(breaks).toEqual([
      "shortBreak",
      "shortBreak",
      "shortBreak",
      "longBreak",
    ]);
    // The count starts again after the long break.
    expect(state).toMatchObject({ phase: "focus", completedFocusCount: 0 });
  });
});

describe("cancel", () => {
  it("returns a running focus period to idle focus and keeps the cycle count", () => {
    const afterBreak = focusThenBreak(initialState(), T0);
    const cancelled = cancel(startPhase(afterBreak, T0, read));
    expect(cancelled).toMatchObject({
      phase: "focus",
      status: "idle",
      startedAt: null,
      endsAt: null,
      completedFocusCount: 1,
    });
  });

  it("returns a running break to idle focus", () => {
    const onBreak = startPhase(
      acknowledge(complete(startPhase(initialState(), T0, read))),
      T0,
    );
    expect(cancel(onBreak)).toMatchObject({ phase: "focus", status: "idle" });
  });
});

describe("parseStoredState", () => {
  it("round-trips a saved state", () => {
    const running = startPhase(initialState(), T0, read);
    expect(parseStoredState(JSON.stringify(running))).toEqual(running);
  });

  it("returns null for missing, malformed or wrongly shaped values", () => {
    expect(parseStoredState(null)).toBeNull();
    expect(parseStoredState("not json")).toBeNull();
    expect(parseStoredState("{}")).toBeNull();
    expect(
      parseStoredState(JSON.stringify({ ...initialState(), phase: "nap" })),
    ).toBeNull();
    expect(
      parseStoredState(
        JSON.stringify({ ...initialState(), status: "running", endsAt: null }),
      ),
    ).toBeNull();
  });
});

describe("formatCountdown", () => {
  it("formats minutes and seconds with two digits", () => {
    expect(formatCountdown(25 * MINUTE)).toBe("25:00");
    expect(formatCountdown(65_000)).toBe("01:05");
    expect(formatCountdown(0)).toBe("00:00");
  });

  it("rounds a started second up and never goes negative", () => {
    expect(formatCountdown(25 * MINUTE - 1)).toBe("25:00");
    expect(formatCountdown(1)).toBe("00:01");
    expect(formatCountdown(-500)).toBe("00:00");
  });
});
