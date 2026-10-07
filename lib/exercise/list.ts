// How the exercise log is shown: which entries, under which date headings.
// No server-only imports, so client components can use it too.

import { parseDay } from "@/lib/dates";

// The list shows this many of the most recent entries, with no paging (A-13).
export const EXERCISE_LIST_LIMIT = 50;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export type DateGroup<Entry> = {
  // `YYYY-MM-DD`.
  date: string;
  // For example "Wed 7 Oct 2026".
  label: string;
  entries: Entry[];
};

/**
 * Groups entries that are already sorted by date into one group per date,
 * keeping the order of the dates and of the entries inside each.
 */
export function groupEntriesByDate<Entry extends { date: string }>(
  entries: Entry[],
): DateGroup<Entry>[] {
  const groups: DateGroup<Entry>[] = [];
  for (const entry of entries) {
    const last = groups.at(-1);
    if (last && last.date === entry.date) {
      last.entries.push(entry);
    } else {
      groups.push({ date: entry.date, label: dateLabel(entry.date), entries: [entry] });
    }
  }
  return groups;
}

export function formatDuration(minutes: number): string {
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

function dateLabel(date: string): string {
  const day = parseDay(date);
  if (!day) return date;
  return `${WEEKDAYS[day.getUTCDay()]} ${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]} ${day.getUTCFullYear()}`;
}
