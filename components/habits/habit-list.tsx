import { HabitDaysHeader, HabitRow } from "@/components/habits/habit-row";
import type { HabitWithCompletions } from "@/lib/data/habits";
import type { HabitDay } from "@/lib/habits/days";

export function HabitList({
  habits,
  days,
}: {
  habits: HabitWithCompletions[];
  // The last 7 days, today last.
  days: HabitDay[];
}) {
  if (habits.length === 0) {
    return <p className="text-sm text-muted-foreground">No habits yet</p>;
  }

  return (
    <div className="rounded-lg border">
      <HabitDaysHeader days={days} />
      <ul className="divide-y">
        {habits.map((habit) => (
          <HabitRow key={habit.id} habit={habit} days={days} />
        ))}
      </ul>
    </div>
  );
}
