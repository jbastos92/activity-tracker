// Small browser stores for `useSyncExternalStore`. Every localStorage access
// is wrapped in try/catch; if storage is unavailable the value is kept in
// memory for the life of the page instead.

type Listener = () => void;

function createLocalStore(key: string) {
  const listeners = new Set<Listener>();
  let memory: string | null = null;
  let storageFailed = false;

  function read(): string | null {
    if (storageFailed) return memory;
    try {
      return window.localStorage.getItem(key);
    } catch {
      storageFailed = true;
      return memory;
    }
  }

  function write(value: string | null): void {
    memory = value;
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch {
      storageFailed = true;
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: Listener): () => void {
    // The storage event reports changes made in other tabs.
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) listener();
    };
    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { read, write, subscribe };
}

/** The timer state as JSON (see `parseStoredState`). */
export const timerStore = createLocalStore("pomodoro-timer");

/** The id of the activity used for the last focus period. */
export const lastActivityStore = createLocalStore("pomodoro-last-activity");

const CLOCK_STEP_MS = 250;

/** A clock for rendering countdowns; the snapshot changes every 250ms. */
export const clock = {
  subscribe(listener: Listener): () => void {
    const id = window.setInterval(listener, CLOCK_STEP_MS);
    return () => window.clearInterval(id);
  },
  read(): number {
    return Math.floor(Date.now() / CLOCK_STEP_MS) * CLOCK_STEP_MS;
  },
  // Before hydration there is no clock; 0 means "not known yet".
  readOnServer(): number {
    return 0;
  },
};
