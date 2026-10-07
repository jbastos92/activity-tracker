// Web Worker holding one timeout aimed at the end of the running phase.
// Page timers are throttled while a tab is in the background; worker timers
// are not. The page sends `endsAt` (epoch milliseconds) and gets "due" back
// once that time has passed. The worker only says when to look: the page
// still decides the end by comparing the real time with the stored `endsAt`.

let timeoutId: ReturnType<typeof setTimeout> | undefined;

function arm(endsAt: number): void {
  const wait = endsAt - Date.now();
  if (wait <= 0) {
    postMessage("due");
    return;
  }
  // Re-checks the time when it fires, in case the timeout came early.
  timeoutId = setTimeout(() => arm(endsAt), wait);
}

addEventListener("message", (event: MessageEvent<number>) => {
  clearTimeout(timeoutId);
  arm(event.data);
});
