import type { HabitSummary } from "@/lib/data/habits";

export function HabitList({ habits }: { habits: HabitSummary[] }) {
  if (habits.length === 0) {
    return <p className="text-sm text-muted-foreground">No habits yet</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {habits.map((habit) => (
        <li key={habit.id} className="px-3 py-2">
          <span className="break-words font-medium">{habit.name}</span>
        </li>
      ))}
    </ul>
  );
}
