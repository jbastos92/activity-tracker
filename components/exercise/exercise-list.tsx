import { ExerciseRow } from "@/components/exercise/exercise-row";
import type { ExerciseEntry } from "@/lib/data/exercise";
import { groupEntriesByDate } from "@/lib/exercise/list";

export function ExerciseList({
  entries,
  today,
}: {
  // Newest date first.
  entries: ExerciseEntry[];
  // The user's local day, `YYYY-MM-DD`.
  today: string;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No exercise logged yet</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {groupEntriesByDate(entries).map((group) => (
        <section key={group.date} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{group.label}</h2>
          <ul className="divide-y rounded-lg border">
            {group.entries.map((entry) => (
              <ExerciseRow key={entry.id} entry={entry} today={today} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
