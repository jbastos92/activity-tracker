// Groups the number of Pomodoros per day into days, weeks and months. Pure
// functions: days are `YYYY-MM-DD` strings and `today` is the user's local
// day. Every view lists its periods newest first, the current one included,
// and a period with no Pomodoros has count 0 (A-27).

import { parseDay } from "@/lib/dates";

/** The number of Pomodoros on each day that has any, keyed by `YYYY-MM-DD`. */
export type DayCounts = Record<string, number>;

export type PeriodCount = {
  label: string;
  // First and last day of the period, both included.
  start: string;
  end: string;
  count: number;
};

export const STATS_DAYS = 14;
export const STATS_WEEKS = 12;
export const STATS_MONTHS = 12;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The last 14 days, for example "Tue 6 Oct". */
export function countsByDay(counts: DayCounts, today: string): PeriodCount[] {
  const end = parseDay(today);
  if (!end) return [];
  return Array.from({ length: STATS_DAYS }, (_, index) => {
    const day = addDays(end, -index);
    return period(`${WEEKDAYS[day.getUTCDay()]} ${dayAndMonth(day)}`, day, day, counts);
  });
}

/** The last 12 weeks, Monday to Sunday (A-26), for example "5 Oct to 11 Oct". */
export function countsByWeek(counts: DayCounts, today: string): PeriodCount[] {
  const monday = mondayOf(today);
  if (!monday) return [];
  return Array.from({ length: STATS_WEEKS }, (_, index) => {
    const start = addDays(monday, -7 * index);
    const end = addDays(start, 6);
    return period(`${dayAndMonth(start)} to ${dayAndMonth(end)}`, start, end, counts);
  });
}

/** The last 12 calendar months, for example "October 2026". */
export function countsByMonth(counts: DayCounts, today: string): PeriodCount[] {
  const day = parseDay(today);
  if (!day) return [];
  return Array.from({ length: STATS_MONTHS }, (_, index) => {
    const start = firstOfMonth(day, -index);
    // Day 0 of the next month is the last day of this one.
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
    return period(
      `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
      start,
      end,
      counts,
    );
  });
}

/** The first day any of the three views covers, or null if `today` is not a day. */
export function earliestStatsDay(today: string): string | null {
  const day = parseDay(today);
  const monday = mondayOf(today);
  if (!day || !monday) return null;
  const starts = [
    addDays(day, -(STATS_DAYS - 1)),
    addDays(monday, -7 * (STATS_WEEKS - 1)),
    firstOfMonth(day, -(STATS_MONTHS - 1)),
  ];
  return toDay(new Date(Math.min(...starts.map((start) => start.getTime()))));
}

/**
 * The rows of the totals table: highest count first, then by name. A removed
 * activity is listed only if it has Pomodoros (A-24).
 */
export function activityTotalRows<
  T extends { name: string; removed: boolean; count: number },
>(totals: T[]): T[] {
  return totals
    .filter((total) => !total.removed || total.count > 0)
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    );
}

function period(
  label: string,
  start: Date,
  end: Date,
  counts: DayCounts,
): PeriodCount {
  let count = 0;
  for (let day = start; day <= end; day = addDays(day, 1)) {
    count += counts[toDay(day)] ?? 0;
  }
  return { label, start: toDay(start), end: toDay(end), count };
}

function mondayOf(value: string): Date | null {
  const day = parseDay(value);
  if (!day) return null;
  // getUTCDay() is 0 for Sunday, which belongs to the week of the Monday before.
  return addDays(day, -((day.getUTCDay() + 6) % 7));
}

function firstOfMonth(day: Date, monthOffset: number): Date {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + monthOffset, 1));
}

// Days are UTC midnights (see `parseDay`), so a day is always 24 hours.
function addDays(day: Date, days: number): Date {
  return new Date(day.getTime() + days * MS_PER_DAY);
}

function toDay(day: Date): string {
  return day.toISOString().slice(0, 10);
}

function dayAndMonth(day: Date): string {
  return `${day.getUTCDate()} ${MONTHS[day.getUTCMonth()].slice(0, 3)}`;
}
