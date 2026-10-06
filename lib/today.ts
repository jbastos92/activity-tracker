import { cookies } from "next/headers";

import { TIME_ZONE_COOKIE, resolveTimeZone, toDayString } from "@/lib/dates";

/** The browser's time zone from the `tz` cookie, or UTC when it is missing or invalid. */
export async function getTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  return resolveTimeZone(cookieStore.get(TIME_ZONE_COOKIE)?.value);
}

/** The user's local calendar day as `YYYY-MM-DD`. Server-side only. */
export async function getToday(): Promise<string> {
  return toDayString(new Date(), await getTimeZone());
}
