import { HabitRow } from "@/components/habits/habit-row";
import type { HabitWithCompletions } from "@/lib/data/habits";

export function HabitList({
  habits,
  today,
}: {
  habits: HabitWithCompletions[];
  // The user's local day, `YYYY-MM-DD`.
  today: string;
}) {
  if (habits.length === 0) {
    return <p className="text-sm text-muted-foreground">No habits yet</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {habits.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          today={today}
          doneToday={habit.completedDays.includes(today)}
        />
      ))}
    </ul>
  );
}
