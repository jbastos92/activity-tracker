import type { Metadata } from "next";
import Link from "next/link";

import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { listActiveActivities } from "@/lib/data/activities";

export const metadata: Metadata = { title: "Pomodoro" };

// Reads the database on every request.
export const dynamic = "force-dynamic";

export default async function PomodoroPage() {
  const activities = await listActiveActivities();

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
    </div>
  );
}
