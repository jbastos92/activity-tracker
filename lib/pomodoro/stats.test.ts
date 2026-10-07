import { describe, expect, it } from "vitest";

import {
  type PeriodCount,
  activityTotalRows,
  countsByDay,
  countsByMonth,
  countsByWeek,
  earliestStatsDay,
} from "@/lib/pomodoro/stats";

// 6 October 2026 is a Tuesday.
const TODAY = "2026-10-06";

function total(periods: PeriodCount[]): number {
  return periods.reduce((sum, period) => sum + period.count, 0);
}

describe("countsByDay", () => {
  it("lists the last 14 days, today first", () => {
    const days = countsByDay({}, TODAY);

    expect(days).toHaveLength(14);
    expect(days[0]).toEqual({
      label: "Tue 6 Oct",
      start: "2026-10-06",
      end: "2026-10-06",
      count: 0,
    });
    expect(days[1].label).toBe("Mon 5 Oct");
    expect(days[13]).toEqual({
      label: "Wed 23 Sep",
      start: "2026-09-23",
      end: "2026-09-23",
      count: 0,
    });
  });

  it("puts each day's count on its own row and 0 everywhere else", () => {
    const days = countsByDay({ "2026-10-06": 3, "2026-10-04": 1 }, TODAY);

    expect(days.map((day) => day.count)).toEqual([3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("leaves out days before the 14 it covers", () => {
    const days = countsByDay({ "2026-09-23": 2, "2026-09-22": 5 }, TODAY);

    expect(total(days)).toBe(2);
  });
});

describe("countsByWeek", () => {
  it("lists the last 12 weeks, the current one first, Monday to Sunday", () => {
    const weeks = countsByWeek({}, TODAY);

    expect(weeks).toHaveLength(12);
    expect(weeks[0]).toEqual({
      label: "5 Oct to 11 Oct",
      start: "2026-10-05",
      end: "2026-10-11",
      count: 0,
    });
    expect(weeks[11]).toMatchObject({ start: "2026-07-20", end: "2026-07-26" });
  });

  it("counts a Sunday in the week that began the Monday before", () => {
    const weeks = countsByWeek({ "2026-10-04": 2 }, TODAY);

    expect(weeks[0].count).toBe(0);
    expect(weeks[1]).toEqual({
      label: "28 Sep to 4 Oct",
      start: "2026-09-28",
      end: "2026-10-04",
      count: 2,
    });
  });

  it("starts the current week today when today is a Monday", () => {
    expect(countsByWeek({}, "2026-10-05")[0]).toMatchObject({
      start: "2026-10-05",
      end: "2026-10-11",
    });
  });

  it("ends the current week today when today is a Sunday", () => {
    expect(countsByWeek({}, "2026-10-11")[0]).toMatchObject({
      start: "2026-10-05",
      end: "2026-10-11",
    });
  });

  it("keeps a week that spans two years together", () => {
    // 1 January 2027 is a Friday.
    const weeks = countsByWeek({ "2026-12-31": 1, "2027-01-01": 2 }, "2027-01-01");

    expect(weeks[0]).toEqual({
      label: "28 Dec to 3 Jan",
      start: "2026-12-28",
      end: "2027-01-03",
      count: 3,
    });
  });

  it("adds up the days of each week", () => {
    const weeks = countsByWeek(
      { "2026-10-05": 1, "2026-10-06": 2, "2026-09-28": 4, "2026-07-20": 1, "2026-07-19": 9 },
      TODAY,
    );

    expect(weeks[0].count).toBe(3);
    expect(weeks[1].count).toBe(4);
    expect(weeks[11].count).toBe(1);
    expect(total(weeks)).toBe(8);
  });
});

describe("countsByMonth", () => {
  it("lists the last 12 months, the current one first", () => {
    const months = countsByMonth({}, TODAY);

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({
      label: "October 2026",
      start: "2026-10-01",
      end: "2026-10-31",
      count: 0,
    });
    expect(months[9]).toMatchObject({ label: "January 2026", start: "2026-01-01" });
    expect(months[11]).toEqual({
      label: "November 2025",
      start: "2025-11-01",
      end: "2025-11-30",
      count: 0,
    });
  });

  it("covers months of 28, 29 and 31 days to their last day", () => {
    const months = countsByMonth({ "2027-02-28": 1, "2027-03-31": 2, "2027-03-01": 4 }, "2027-03-31");

    expect(months[0]).toEqual({ label: "March 2027", start: "2027-03-01", end: "2027-03-31", count: 6 });
    expect(months[1]).toEqual({ label: "February 2027", start: "2027-02-01", end: "2027-02-28", count: 1 });
    expect(countsByMonth({}, "2028-02-10")[0].end).toBe("2028-02-29");
  });

  it("leaves out days before the 12 months it covers", () => {
    const months = countsByMonth({ "2025-11-01": 2, "2025-10-31": 5, "2026-10-06": 1 }, TODAY);

    expect(total(months)).toBe(3);
  });
});

describe("all three views", () => {
  it("are empty when today is not a real day", () => {
    expect(countsByDay({}, "2026-02-30")).toEqual([]);
    expect(countsByWeek({}, "today")).toEqual([]);
    expect(countsByMonth({}, "")).toEqual([]);
  });
});

describe("earliestStatsDay", () => {
  it("is the first day any view needs", () => {
    expect(earliestStatsDay(TODAY)).toBe("2025-11-01");
  });

  it("is null when today is not a real day", () => {
    expect(earliestStatsDay("2026-13-01")).toBeNull();
  });
});

describe("activityTotalRows", () => {
  const activity = (name: string, count: number, removed = false) => ({
    id: name,
    name,
    removed,
    count,
  });

  it("puts the highest count first", () => {
    const rows = activityTotalRows([activity("Read", 2), activity("Study", 7), activity("Write", 4)]);

    expect(rows.map((row) => row.name)).toEqual(["Study", "Write", "Read"]);
  });

  it("orders equal counts by name, ignoring upper and lower case", () => {
    const rows = activityTotalRows([activity("write", 3), activity("Study", 3), activity("read", 3)]);

    expect(rows.map((row) => row.name)).toEqual(["read", "Study", "write"]);
  });

  it("keeps an active activity that has no Pomodoros", () => {
    expect(activityTotalRows([activity("Read", 0)])).toEqual([activity("Read", 0)]);
  });

  it("keeps a removed activity only when it has Pomodoros", () => {
    const rows = activityTotalRows([activity("Old", 0, true), activity("Older", 5, true)]);

    expect(rows).toEqual([activity("Older", 5, true)]);
  });

  it("does not change the list it was given", () => {
    const totals = [activity("Read", 1), activity("Study", 2)];
    activityTotalRows(totals);

    expect(totals.map((total) => total.name)).toEqual(["Read", "Study"]);
  });
});
