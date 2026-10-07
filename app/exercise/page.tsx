import type { Metadata } from "next";

import { ExerciseForm } from "@/components/exercise/exercise-form";
import { ExerciseList } from "@/components/exercise/exercise-list";
import { listExerciseEntries } from "@/lib/data/exercise";
import { EXERCISE_LIST_LIMIT } from "@/lib/exercise/list";
import { getToday } from "@/lib/today";

export const metadata: Metadata = { title: "Exercise" };

// Reads the database on every request.
export const dynamic = "force-dynamic";

export default async function ExercisePage() {
  const today = await getToday();
  const entries = await listExerciseEntries(EXERCISE_LIST_LIMIT);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Exercise</h1>
      <ExerciseForm today={today} />
      <ExerciseList entries={entries} today={today} />
    </div>
  );
}
