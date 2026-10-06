import type { Metadata } from "next";
import Link from "next/link";

import { ActivityForm } from "@/components/pomodoro/activity-form";
import { ActivityList } from "@/components/pomodoro/activity-list";
import { listActiveActivities } from "@/lib/data/activities";

export const metadata: Metadata = { title: "Activities" };

// Reads the database on every request.
export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const activities = await listActiveActivities();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/pomodoro"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Back to Pomodoro
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Activities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each Pomodoro is counted against one of these activities.
        </p>
      </div>
      <ActivityForm />
      <ActivityList activities={activities} />
    </div>
  );
}
