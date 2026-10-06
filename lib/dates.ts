// Calendar-day helpers. A "day" is always a `YYYY-MM-DD` string in the user's
// local time zone. This module has no server-only imports, so client
// components can use it too; `getToday()` lives in `lib/today.ts`.

export const TIME_ZONE_COOKIE = "tz";

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function resolveTimeZone(value: string | undefined | null): string {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

export function toDayString(date: Date, timeZone: string): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Parses `YYYY-MM-DD` to that day's UTC midnight, or null if it is not a real day. */
export function parseDay(value: string): Date | null {
  const match = DAY_PATTERN.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC rolls 02-30 over to March; reject anything that does not round-trip.
  return formatUtcDay(date) === value ? date : null;
}

/** The `n` days ending with `today`, oldest first. */
export function lastNDays(today: string, n: number): string[] {
  const end = parseDay(today);
  if (!end) return [];
  return Array.from({ length: n }, (_, index) =>
    formatUtcDay(new Date(end.getTime() - (n - 1 - index) * MS_PER_DAY)),
  );
}

function formatUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
