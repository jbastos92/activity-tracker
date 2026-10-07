"use client";

import { useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type PeriodCount,
  type StatsPeriod,
  parseStatsPeriod,
} from "@/lib/pomodoro/stats";

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

/**
 * Number of Pomodoros per day, week or month across all activities, as a
 * plain table (A-25). The chosen period lives in the URL as `?period=week`,
 * so it survives a reload; no parameter means Day.
 */
export function PeriodCounts({
  counts,
}: {
  // Each list is newest first, so its first row is the current period.
  counts: Record<StatsPeriod, PeriodCount[]>;
}) {
  const searchParams = useSearchParams();
  const period = parseStatsPeriod(searchParams.get("period"));

  function choose(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const next = parseStatsPeriod(value);
    if (next === "day") params.delete("period");
    else params.set("period", next);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `?${query}` : window.location.pathname,
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Pomodoros per period</h2>
      <Tabs value={period} onValueChange={choose}>
        <TabsList>
          {PERIODS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {PERIODS.map(({ value }) => (
          <TabsContent key={value} value={value}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th scope="col" className="px-2 py-2 font-medium">
                    Period
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    Pomodoros
                  </th>
                </tr>
              </thead>
              <tbody>
                {counts[value].map((row, index) => (
                  <tr
                    key={row.start}
                    aria-current={index === 0 ? "true" : undefined}
                    className={
                      index === 0 ? "border-b bg-muted font-semibold" : "border-b"
                    }
                  >
                    <th
                      scope="row"
                      className={
                        index === 0
                          ? "px-2 py-2 text-left"
                          : "px-2 py-2 text-left font-normal"
                      }
                    >
                      {row.label}
                    </th>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
