import type { Metadata } from "next";
import Link from "next/link";

import { ActivityTotals } from "@/components/pomodoro/activity-totals";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { TodaySummary } from "@/components/pomodoro/today-summary";
import { listActiveActivities } from "@/lib/data/activities";
import {
  countPomodorosByActivity,
  countPomodorosOn,
} from "@/lib/data/pomodoro";
import { getToday } from "@/lib/today";

export const metadata: Metadata = { title: "Pomodoro" };

// Reads the database on every request.
export const dynamic = "force-dynamic";

export default async function PomodoroPage() {
  const [activities, todayCount, activityTotals] = await Promise.all([
    listActiveActivities(),
    getToday().then(countPomodorosOn),
    countPomodorosByActivity(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Pomodoro</h1>
        <Link
          href="/pomodoro/activities"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Manage activities
        </Link>
      </div>
      <PomodoroTimer activities={activities} />
      <TodaySummary count={todayCount} />
      <ActivityTotals totals={activityTotals} />
    </div>
  );
}
