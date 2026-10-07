// The days shown on the habits screen: the last 7, which are also the only
// ones that can be ticked or unticked (A-9). No server-only imports, so client
// components can use it too.

import { lastNDays, parseDay } from "@/lib/dates";

export const HABIT_DAYS = 7;

export type HabitDay = {
  // `YYYY-MM-DD`.
  date: string;
  // For example "Tue".
  weekday: string;
  dayNumber: number;
  isToday: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The last 7 days ending with `today`, oldest first. Empty if `today` is not a day. */
export function habitDays(today: string): HabitDay[] {
  return lastNDays(today, HABIT_DAYS).flatMap((date) => {
    const day = parseDay(date);
    if (!day) return [];
    return {
      date,
      weekday: WEEKDAYS[day.getUTCDay()],
      dayNumber: day.getUTCDate(),
      isToday: date === today,
    };
  });
}

/** Whether `date` is one of the last 7 days ending with `today`. */
export function isEditableHabitDay(date: string, today: string): boolean {
  return lastNDays(today, HABIT_DAYS).includes(date);
}
