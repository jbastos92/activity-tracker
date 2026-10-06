"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { TIME_ZONE_COOKIE } from "@/lib/dates";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/** Stores the browser's IANA time zone in a cookie so the server knows the user's local day. */
export function TimeZoneCookie() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone || readCookie(TIME_ZONE_COOKIE) === timeZone) return;

    document.cookie = `${TIME_ZONE_COOKIE}=${timeZone}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    // The server rendered this page before it knew the zone; render it again.
    router.refresh();
  }, [router]);

  return null;
}
