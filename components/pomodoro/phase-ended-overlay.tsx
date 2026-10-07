"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { focusEndedTitle, nextBreakText } from "@/lib/pomodoro/messages";
import type { TimerState } from "@/lib/pomodoro/timer";

/**
 * Covers the whole app while a focus period is in the "ended" state. It
 * closes only through Continue; breaks never show it.
 */
export function PhaseEndedOverlay({
  state,
  onContinue,
}: {
  state: TimerState;
  onContinue: () => void;
}) {
  const open = state.status === "ended" && state.activity !== null;

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        // No open or close animation: the message must not shrink in, and its
        // text is gone the moment the state leaves "ended".
        className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col items-center justify-center gap-6 rounded-none bg-background p-6 text-center ring-0 data-closed:animate-none! data-open:animate-none! sm:max-w-none"
      >
        <DialogTitle className="text-3xl leading-tight font-semibold sm:text-4xl">
          {state.activity && focusEndedTitle(state.activity.name)}
        </DialogTitle>
        <DialogDescription className="text-lg">
          {nextBreakText(state.completedFocusCount)}
        </DialogDescription>
        {/* The only focusable element, so it takes keyboard focus on open. */}
        <Button size="lg" onClick={onContinue}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
