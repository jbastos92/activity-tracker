import type { Metadata } from "next";

import { HabitForm } from "@/components/habits/habit-form";
import { HabitList } from "@/components/habits/habit-list";
import { listHabitsWithCompletions } from "@/lib/data/habits";
import { getToday } from "@/lib/today";

export const metadata: Metadata = { title: "Habits" };

// Reads the database on every request.
export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const today = await getToday();
  const habits = await listHabitsWithCompletions(today, today);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Habits</h1>
      <HabitForm />
      <HabitList habits={habits} />
    </div>
  );
}
