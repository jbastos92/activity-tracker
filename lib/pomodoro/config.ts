// Fixed Pomodoro durations. There is no settings screen (A-2).
export const POMODORO_CONFIG = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  // A long break follows every 4th focus period.
  focusPeriodsPerCycle: 4,
} as const;
