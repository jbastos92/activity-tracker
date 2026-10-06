import { describe, expect, it } from "vitest";

import {
  lastNDays,
  parseDay,
  resolveTimeZone,
  toDayString,
} from "@/lib/dates";

describe("toDayString", () => {
  // America/Sao_Paulo is UTC-3, so local midnight is 03:00 UTC.
  it("gives the previous day just before local midnight", () => {
    const instant = new Date("2026-03-01T02:59:59Z");
    expect(toDayString(instant, "America/Sao_Paulo")).toBe("2026-02-28");
  });

  it("gives the new day just after local midnight", () => {
    const instant = new Date("2026-03-01T03:00:00Z");
    expect(toDayString(instant, "America/Sao_Paulo")).toBe("2026-03-01");
  });

  it("handles a zone ahead of UTC", () => {
    const instant = new Date("2026-12-31T15:30:00Z");
    expect(toDayString(instant, "Asia/Tokyo")).toBe("2027-01-01");
  });

  it("falls back to UTC for an invalid time zone", () => {
    const instant = new Date("2026-03-01T02:59:59Z");
    expect(toDayString(instant, "Not/A_Zone")).toBe("2026-03-01");
  });
});

describe("resolveTimeZone", () => {
  it("keeps a valid IANA zone", () => {
    expect(resolveTimeZone("America/Sao_Paulo")).toBe("America/Sao_Paulo");
  });

  it("falls back to UTC when the value is missing or invalid", () => {
    expect(resolveTimeZone(undefined)).toBe("UTC");
    expect(resolveTimeZone("")).toBe("UTC");
    expect(resolveTimeZone("Not/A_Zone")).toBe("UTC");
  });
});

describe("parseDay", () => {
  it("parses a valid day to UTC midnight", () => {
    expect(parseDay("2026-10-05")?.toISOString()).toBe(
      "2026-10-05T00:00:00.000Z",
    );
  });

  it("rejects malformed values and days that do not exist", () => {
    expect(parseDay("2026-2-5")).toBeNull();
    expect(parseDay("05/10/2026")).toBeNull();
    expect(parseDay("2026-02-30")).toBeNull();
    expect(parseDay("2026-13-01")).toBeNull();
    expect(parseDay("")).toBeNull();
  });
});

describe("lastNDays", () => {
  it("returns n days ending today, oldest first, across a month boundary", () => {
    expect(lastNDays("2026-03-02", 4)).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });

  it("crosses a year boundary", () => {
    expect(lastNDays("2027-01-01", 2)).toEqual(["2026-12-31", "2027-01-01"]);
  });

  it("returns only today for n = 1 and nothing for an invalid day", () => {
    expect(lastNDays("2026-03-02", 1)).toEqual(["2026-03-02"]);
    expect(lastNDays("not-a-day", 3)).toEqual([]);
  });
});
