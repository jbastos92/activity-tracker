import { HabitRow } from "@/components/habits/habit-row";
import type { HabitSummary } from "@/lib/data/habits";

export function HabitList({ habits }: { habits: HabitSummary[] }) {
  if (habits.length === 0) {
    return <p className="text-sm text-muted-foreground">No habits yet</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} />
      ))}
    </ul>
  );
}
