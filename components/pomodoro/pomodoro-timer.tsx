"use client";

import Link from "next/link";
import { useState } from "react";

import { ActivityPicker } from "@/components/pomodoro/activity-picker";
import { NotificationStatus } from "@/components/pomodoro/notification-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLastActivityId, usePomodoroTimer } from "@/hooks/use-pomodoro-timer";
import type { ActivitySummary } from "@/lib/data/activities";
import { requestNotificationPermission } from "@/lib/pomodoro/notifications";
import { type Phase, formatCountdown } from "@/lib/pomodoro/timer";

const PHASE_LABELS: Record<Phase, string> = {
  focus: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

export function PomodoroTimer({ activities }: { activities: ActivitySummary[] }) {
  const timer = usePomodoroTimer();
  const lastActivityId = useLastActivityId();
  const [chosenId, setChosenId] = useState<string | null>(null);

  // The user's choice wins; otherwise the activity used last time, unless it
  // has been removed since.
  const selected =
    activities.find((activity) => activity.id === chosenId) ??
    activities.find((activity) => activity.id === lastActivityId) ??
    null;

  const isFocus = timer.phase === "focus";
  const waitingForFocus = isFocus && timer.status === "idle";
  const canStart = timer.status === "idle" && (!isFocus || selected !== null);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-5 py-4 text-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {PHASE_LABELS[timer.phase]}
            {timer.status === "ended" && " (ended)"}
          </p>
          {timer.activity && (
            <p className="mt-1 text-lg font-medium">{timer.activity.name}</p>
          )}
        </div>

        <p
          role="timer"
          aria-label={`${PHASE_LABELS[timer.phase]} time remaining`}
          className="font-mono text-6xl font-semibold tabular-nums sm:text-7xl"
        >
          {formatCountdown(timer.remainingMs)}
        </p>

        {timer.breakJustEnded && (
          <p className="text-sm text-muted-foreground">Break is over</p>
        )}

        {waitingForFocus &&
          (activities.length > 0 ? (
            <ActivityPicker
              activities={activities}
              value={selected?.id ?? null}
              onChange={setChosenId}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Add an activity before starting.{" "}
              <Link
                href="/pomodoro/activities"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Manage activities
              </Link>
            </p>
          ))}

        {timer.status === "idle" && (
          <Button
            size="lg"
            disabled={!canStart}
            onClick={() => {
              // Asks only while permission is undecided; the timer starts
              // without waiting for the answer.
              void requestNotificationPermission();
              timer.start(isFocus ? (selected ?? undefined) : undefined);
            }}
          >
            Start
          </Button>
        )}
        {timer.status === "running" && (
          <Button size="lg" variant="outline" onClick={timer.cancel}>
            Cancel
          </Button>
        )}
        {timer.status === "ended" && (
          <Button size="lg" onClick={timer.acknowledge}>
            Continue
          </Button>
        )}

        <NotificationStatus />
      </CardContent>
    </Card>
  );
}
