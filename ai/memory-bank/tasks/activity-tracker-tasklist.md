# Activity Tracker Development Tasks

## Specification Summary

**Original requirements** (the product owner's own words, and the complete spec):

1. "It is a web app."
2. "It tracks work time using the Pomodoro pattern."
3. "It also tracks habits and exercise."

4. Confirmed afterwards by the owner: it is for one person only ("just me, single user is fine"). There are no accounts and no login.

5. Added afterwards by the owner, about the Pomodoro timer: "when pomodoro end, the screen should me focused showing the message informing the end of pomodoro cycle. thats the idea". Meaning: when an interval ends, the app grabs the user's attention and shows a clear message that it ended.

6. Added afterwards by the owner, answering open questions and adding requirements: "no sound planned now. Only after focus periods. my browser is chrome. simple log. It means every complete pomodoro is 25min, so we count just how many times a specific activity was woked, like ˜Read˜, and every time I read i run the pomodoro cycle. After all we should have the stack by activity and the stack of how many pomodoros by day, week, month."

**What requirement 6 settles** (confirmed by the owner, no longer assumptions):

- No sound when an interval ends.
- The end message, the desktop notification and the tab-title signal happen only when a focus period ends, not when a break ends.
- The owner's browser is Chrome. All browser checks in this list are for current desktop Chrome only.
- Exercise tracking is a simple log.
- A complete Pomodoro is 25 minutes of focus.
- **Activities**: every Pomodoro belongs to a named activity the owner defines (for example "Read"). The owner picks the activity, runs the Pomodoro, and the completed Pomodoro is counted against that activity.
- **Statistics**: the unit is the number of completed Pomodoros, not minutes. Two views are wanted: totals per activity, and number of Pomodoros per day, per week and per month.

7. Decided afterwards by the owner: "lets go for SQLite and forget about the 'how many Read Pomodoros you did this week, that needs a per-activity breakdown by period.'"

**What requirement 7 settles** (confirmed by the owner):

- The database is SQLite, a single local file, not PostgreSQL. There is no database server to install or run.
- Totals per activity are all-time, and the day, week and month view counts all activities together. A breakdown per activity by period (for example "Read" Pomodoros this week) is **out of scope**.

Nothing else has been requested. Multi-user support, accounts and authentication are **out of scope**. Charts, streaks, gamification, sounds, integrations, data export and mobile apps are **out of scope** and must not be added while implementing these tasks. Notifications are in scope for one purpose only: announcing the end of a focus period (requirement 5). Statistics are in scope for Pomodoros only, as plain tables (requirement 6).

**Browser limit on requirement 5**: a web page cannot bring its own tab or window to the foreground; browsers block that. The plan is the closest feasible behaviour (Tasks 3.7 to 3.11): a full-screen message inside the app, a desktop notification that brings the tab to the front when the user clicks it, and a changed tab title when notifications are not allowed. No task may claim that the tab comes to the front by itself.

**Technical stack** (given by the team, not by the owner):

- Next.js (App Router), React, TypeScript in strict mode, Node.js
- Tailwind CSS with shadcn/ui components
- Prisma with SQLite (chosen by the owner in requirement 7, replacing the team's original PostgreSQL)
- Light / dark / system theme toggle via next-themes

**Target timeline**: none stated. The project is 36 tasks of roughly 30 to 60 minutes each, in 5 phases.

**No spec file on disk**: `ai/memory-bank/site-setup.md` does not exist. This document is the working record of the requirements.

## How to read this list

- Phases are in build order. Tasks inside a phase are in order too, unless a task says otherwise.
- Every detail marked **(A-n)** is an inference, not an owner requirement. It points to the "Assumptions to confirm" section. If the owner answers differently, the task changes.
- Standard checks referred to in acceptance criteria as "the standard checks pass": `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` all exit with code 0.

## Conventions that apply to every task

1. **Database queries live in `lib/data/*.ts`.** Pages, components and server actions call functions from `lib/data/` instead of using the Prisma client directly.
2. **Mutations are Server Actions** in `app/<feature>/actions.ts`. They validate input with zod, call `lib/data/`, then call `revalidatePath`. No REST API routes are needed.
3. **Every tracked record has a `date` column**: a `String` holding a calendar day as `YYYY-MM-DD` (SQLite has no date-only type; this format sorts and compares correctly as text). "Today" is always the user's local calendar day, obtained through `lib/dates.ts` (Task 2.1), never `new Date()` on the server.
4. **No background work**: no cron jobs, queues, server-side workers, websockets or service workers. The only process is the Next.js app; SQLite is a file, not a server. The one in-browser Web Worker in Task 3.7 is part of the page, lives only while the tab is open, and is not a service.
5. Follow the current official docs for the installed major versions of Next.js, Prisma, Tailwind and shadcn/ui. File names that vary between versions (for example the Prisma config file) follow the installed version.

---

## Phase 1: Project setup (6 tasks)

### [x] Task 1.1: Scaffold the Next.js app
**Description**: Create the Next.js App Router project with TypeScript, Tailwind CSS and ESLint in the repository root.
**Files**: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `README.md`
**Acceptance criteria**:
- `tsconfig.json` has `"strict": true`.
- `package.json` has scripts `dev`, `build`, `lint` and `typecheck` (`tsc --noEmit`).
- `npm run dev` serves a page at http://localhost:3000 with no errors in the browser console.
- `npm run lint`, `npm run typecheck` and `npm run build` exit with code 0.
- The existing `ai/` folder is untouched.
**Done notes**: Next.js 16.3.8, React 19.2.8. `typecheck` is `next typegen && tsc --noEmit`, because the layout uses Next's generated `LayoutProps` type and plain `tsc` fails on a clean checkout without it. `AGENTS.md` and `CLAUDE.md` were created by create-next-app.

### [x] Task 1.2: Install shadcn/ui and base components
**Description**: Initialise shadcn/ui and add the components the later tasks use: button, card, input, label, checkbox, dialog, dropdown-menu.
**Files**: `components.json`, `components/ui/*`, `lib/utils.ts`, `app/globals.css`
**Acceptance criteria**:
- `app/page.tsx` temporarily renders one shadcn `Button` and it is visibly styled in the browser.
- The listed components exist under `components/ui/`.
- `npm run build` exits with code 0.

### [x] Task 1.3: Theme toggle (light / dark / system)
**Description**: Add next-themes and a toggle with the three options Light, Dark and System.
**Files**: `components/theme-provider.tsx`, `components/theme-toggle.tsx`, `app/layout.tsx`
**Acceptance criteria**:
- Choosing Light or Dark changes the page colours immediately and the choice survives a page reload.
- Choosing System follows the operating system setting (check by switching the OS appearance).
- No hydration warning appears in the browser console on load.
**Done notes**: Checked in headless Chrome: the page follows the system scheme in both light and dark, and the console shows no errors or hydration warnings. Later checked in Chrome: choosing Light and choosing Dark each change the colours at once and survive a reload.

### [x] Task 1.4: App shell and navigation
**Description**: Add a shared header with the app name, links to the three sections and the theme toggle, plus placeholder pages for each section.
**Files**: `app/layout.tsx`, `components/site-header.tsx`, `app/page.tsx`, `app/pomodoro/page.tsx`, `app/habits/page.tsx`, `app/exercise/page.tsx`
**Acceptance criteria**:
- The header shows links "Pomodoro", "Habits" and "Exercise"; each opens its page, which shows a heading with the section name.
- The link for the current section is visually marked as active.
- `/` redirects to `/pomodoro` **(A-15)**.
- At 375px viewport width the header fits with no horizontal scrolling.
**Done notes**: Checked at 375px in headless Chrome; the section links wrap onto a second row below the app name and theme toggle.

### [x] Task 1.5: Prisma and SQLite setup
**Description**: Install Prisma, configure the SQLite datasource from `DATABASE_URL` (a local file), and add the shared client module. No models yet.
**Files**: `prisma/schema.prisma`, `lib/db.ts`, `.env.example`, `.gitignore`, `package.json`, `README.md`
**Acceptance criteria**:
- The datasource provider is `sqlite` and `.env.example` contains `DATABASE_URL="file:./dev.db"`.
- `.env` and the database file are git-ignored: `.gitignore` covers `*.db`, `*.db-journal`, `*.db-wal` and `*.db-shm`. After the first migration (Task 2.2), `git status` does not list the database file.
- `lib/db.ts` exports a single Prisma client instance that is reused across hot reloads in development. If the installed Prisma version requires a driver adapter for SQLite, it is set up here following the Prisma docs.
- `npx prisma validate` exits with code 0.
- No database server, Docker container or other service is needed; `README.md` says where the database file lives, that copying that file is the backup, and how to run the app locally.
**Done notes**: Prisma is pinned to 7.10.0 for both `prisma` and `@prisma/client` (npm's `latest` tag for `prisma` pointed at an 8.0 release candidate). Prisma 7 needs a driver adapter, so `@prisma/adapter-better-sqlite3` is used. Extra files: `prisma.config.ts` (holds the datasource URL in Prisma 7) and the generated client in `lib/generated/prisma` (git-ignored, rebuilt by `npm install` through a `postinstall` script). `.gitignore` also un-ignores `.env.example`.

### [x] Task 1.6: Unit test runner
**Description**: Add Vitest for the pure logic modules (timer logic, date helpers, validation). No browser or end-to-end test setup.
**Files**: `vitest.config.ts`, `package.json`, `lib/utils.test.ts`
**Acceptance criteria**:
- `npm test` runs once (not in watch mode) and exits with code 0 with at least one passing test.
- The `@/` import alias works inside tests.
**Done notes**: The config file is `vitest.config.mts`, not `.ts`, to avoid a Vite warning about ESM syntax in a CommonJS-loaded config. `@types/node` was raised to ^24 because Vitest 5 requires it.

---

## Phase 2: Data model (5 tasks)

The app is single-user by confirmed requirement: there is no `User` model and no owner column on any table.

### [x] Task 2.1: Local-day helper and time zone cookie
**Description**: Give the server a reliable way to know the user's local calendar day: a small client component stores the browser time zone in a cookie, and `lib/dates.ts` turns it into a `YYYY-MM-DD` day.
**Files**: `lib/dates.ts`, `lib/dates.test.ts`, `components/time-zone-cookie.tsx`, `app/layout.tsx`
**Acceptance criteria**:
- After the first page load a cookie named `tz` holds the browser's IANA time zone (for example `America/Sao_Paulo`), visible in the browser dev tools.
- `lib/dates.ts` exports `getToday()` (server-side, reads the cookie, falls back to UTC when it is missing or invalid), `toDayString(date, timeZone)`, `parseDay(string)` and `lastNDays(today, n)`.
- Unit tests cover: an instant just before and just after local midnight in a non-UTC zone, an invalid time zone value, and `lastNDays` across a month boundary.
- `npm test` exits with code 0.
**Done notes**: `getToday()` is in `lib/today.ts`, not `lib/dates.ts`. It imports `next/headers`, which client components cannot import, and the pure helpers in `lib/dates.ts` are needed on the client later (Task 3.13). `lib/dates.ts` also exports `resolveTimeZone`. `lastNDays` returns the days oldest first, today last. The `tz` cookie was confirmed in headless Chrome (`tz=America/Sao_Paulo`); `getToday()` reading it on the server is first exercised by a page in Task 3.13.

### [x] Task 2.2: Activity model
**Description**: Add the model for a named activity that Pomodoros are counted against (for example "Read").
**Files**: `prisma/schema.prisma`, `prisma/migrations/*`
**Fields**: `id`, `name` (String, as typed), `nameKey` (String, unique: the name trimmed and lower-cased), `archivedAt` (DateTime, optional; set when the owner removes the activity), `createdAt`.
**Acceptance criteria**:
- `npx prisma migrate dev` creates the database file and the table, and exits with code 0. This is the first migration, so it also proves the connection from Task 1.5 works.
- Inserting two activities with the same `nameKey` fails with a unique constraint error (check in `npx prisma studio`). The `nameKey` column exists because Prisma's case-insensitive filter (`mode: insensitive`) is not available on SQLite.
- A removed activity is a row with `archivedAt` set, not a deleted row **(A-24)**.
**Done notes**: Constraints were checked with a one-off script through `lib/db.ts` instead of Prisma Studio; it cleaned up its own rows. Ids are `cuid()` strings on every model. In Prisma 7 `migrate dev` does not regenerate the client, so run `npx prisma generate` after each migration.

### [x] Task 2.3: PomodoroSession model
**Description**: Add the model that stores one completed focus period, linked to its activity.
**Files**: `prisma/schema.prisma`, `prisma/migrations/*`
**Fields**: `id`, `activityId` (required relation to `Activity`, delete restricted), `startedAt` (DateTime, unique), `endedAt` (DateTime), `durationSeconds` (Int), `date` (String `YYYY-MM-DD`, indexed), `createdAt`.
**Acceptance criteria**:
- `npx prisma migrate dev` creates the table and exits with code 0.
- The unique constraint on `startedAt` exists (it makes saving idempotent, see Task 3.12).
- A session cannot be saved without an activity, and deleting an `Activity` row that has sessions is refused by the database.
- Breaks are not stored **(A-3)**.
**Done notes**: Checked by script: a duplicate `startedAt` and an unknown `activityId` are refused, and deleting an activity that has sessions is refused.

### [x] Task 2.4: Habit and HabitCompletion models
**Description**: Add a habit (a name) and a completion (that habit was done on a given day).
**Files**: `prisma/schema.prisma`, `prisma/migrations/*`
**Fields**: `Habit`: `id`, `name`, `createdAt`. `HabitCompletion`: `id`, `habitId` (relation, cascade delete), `date` (String `YYYY-MM-DD`), `createdAt`, unique on `[habitId, date]`.
**Acceptance criteria**:
- `npx prisma migrate dev` exits with code 0.
- Inserting two completions for the same habit and date fails with a unique constraint error (check in `npx prisma studio` or a one-off script).
- Deleting a habit deletes its completions.
**Done notes**: Checked by script: a duplicate completion is refused and deleting a habit removed its completions.

### [x] Task 2.5: ExerciseEntry model
**Description**: Add the model that stores one logged exercise session.
**Files**: `prisma/schema.prisma`, `prisma/migrations/*`
**Fields**: `id`, `date` (String `YYYY-MM-DD`, indexed), `activity` (String), `durationMinutes` (Int), `notes` (String, optional), `createdAt` **(A-11)**.
**Acceptance criteria**:
- `npx prisma migrate dev` exits with code 0.
- `npx prisma studio` shows the table with the listed columns.
- The `activity` column is free text and has no relation to the `Activity` model of Task 2.2 **(A-29)**.
**Done notes**: Columns confirmed from the SQLite schema and a test insert rather than Prisma Studio. `README.md` now includes `npx prisma migrate deploy` in the setup steps.

---

## Phase 3: Pomodoro work-time tracking (16 tasks)

Owner requirements: "It tracks work time using the Pomodoro pattern."; the end-of-focus message (requirement 5); and activities and statistics (requirement 6). Details marked (A-n) are assumptions. Tasks 3.4 to 3.6 cover activities, 3.7 to 3.11 the end-of-focus message, 3.12 and 3.13 recording, 3.14 to 3.16 statistics.

### [x] Task 3.1: Pomodoro timer logic (pure functions)
**Description**: Implement the timer rules as pure, framework-free functions with unit tests.
**Files**: `lib/pomodoro/config.ts`, `lib/pomodoro/timer.ts`, `lib/pomodoro/timer.test.ts`
**Acceptance criteria**:
- `config.ts` holds the fixed durations: focus 25 minutes, short break 5 minutes, long break 15 minutes, long break after every 4th focus interval **(A-1, A-2)**.
- `timer.ts` exports functions to: start a phase (returns state with `phase`, `startedAt`, `endsAt`), compute remaining milliseconds from `endsAt` and the current time (never below 0), tell whether the phase has finished, and compute the next phase from the current phase and the count of completed focus intervals.
- Remaining time is always derived from `endsAt`, never from counting ticks.
- Tests cover: the sequence focus, short break (three times), then focus, long break; remaining time at start, midway and after the end; cancelling returns to an idle focus phase.
- `npm test` exits with code 0.
**Done notes**: `timer.ts` already holds the full state rules that Tasks 3.6 and 3.7 describe (activity on a focus period, the "ended" state with `acknowledge`, breaks going straight to idle focus with a "break just ended" flag), plus `parseStoredState` and `formatCountdown`, all unit-tested. Tasks 3.6 and 3.7 therefore need little or no change to this file.

### [x] Task 3.2: Timer hook with persistence across reloads
**Description**: Wrap the timer logic in a React hook that ticks once per second and keeps the running state in `localStorage`, so reloading or visiting another section does not lose a running timer.
**Files**: `hooks/use-pomodoro-timer.ts`
**Acceptance criteria**:
- The hook exposes the current phase, remaining time, running flag, completed-interval count for the current cycle, and `start` and `cancel` functions.
- Reading `localStorage` happens after mount, with every access wrapped in try/catch; no hydration warning appears in the console.
- With a timer running, reloading the page shows the correct remaining time (within 1 second of a stopwatch).
- If the page is reopened after `endsAt` has passed, the hook reports the phase as finished rather than showing a negative time.
- (Verified through the page built in Task 3.3; this task may ship with a temporary debug render.)
**Done notes**: Built on `useSyncExternalStore` over small stores in `lib/pomodoro/store.ts` (timer state, last-used activity and a 250ms clock) instead of `useState` plus an effect; this avoids hydration warnings and also picks up changes from other tabs. The hook also exposes `status`, `activity`, `breakJustEnded` and `acknowledge`. Checked in Chrome: a reload during a running focus period showed 24:55 with 1494.8s really remaining.

### [x] Task 3.3: Pomodoro page with countdown and controls
**Description**: Build the `/pomodoro` page: phase name, `MM:SS` countdown, a Start button and a Cancel button.
**Files**: `app/pomodoro/page.tsx`, `components/pomodoro/pomodoro-timer.tsx`
**Acceptance criteria**:
- On first visit the page shows "Focus" and "25:00" with a Start button.
- Clicking Start counts down once per second; a Cancel button replaces Start while running.
- Clicking Cancel returns to "Focus 25:00" and nothing is recorded **(A-4, A-5)**.
- When a phase reaches 00:00 the countdown stays at 00:00 with the phase marked as ended (the end-of-focus message arrives in Task 3.8).
- Navigating to `/habits` and back while running shows the correct remaining time.
- To check quickly, temporarily set the focus duration in `lib/pomodoro/config.ts` to a few seconds; restore it before committing.
**Done notes**: When a focus period ends the page shows "Focus (ended)" at 00:00 with a Continue button, so the timer is usable before the overlay of Task 3.8 exists. The end-of-period flow was checked in headless Chrome by writing a state with a near `endsAt` into `localStorage`, so `config.ts` was never changed. Section navigation while running was checked there too: client-side navigation does not complete while a Chrome tab is in the background.

### [x] Task 3.4: Activity data functions and validation
**Description**: Implement the data functions and zod schema for activities.
**Files**: `lib/data/activities.ts`, `lib/validation/activities.ts`, `lib/validation/activities.test.ts`
**Acceptance criteria**:
- Functions exist for: list active activities (oldest first), create, rename, remove.
- A name is trimmed and must be 1 to 60 characters; a blank name is rejected. Names are unique ignoring upper and lower case: "Read" and "read" cannot both exist. This is done by writing `nameKey` (trimmed, lower-cased) on every create and rename and looking activities up by it, not with `mode: insensitive`, which SQLite does not support.
- Remove sets `archivedAt` and never deletes the row, so recorded Pomodoros keep their activity **(A-24)**.
- Creating an activity whose name matches a removed one restores that activity (clears `archivedAt`) instead of failing **(A-24)**.
- Unit tests cover the validation rules; `npm test` exits with code 0.
**Done notes**: A restored activity takes the newly typed spelling of its name. Renaming to a name that belongs to a removed activity is refused with a message telling the user to add it again to bring it back.

### [x] Task 3.5: Manage activities (create, rename, remove)
**Description**: Build `/pomodoro/activities`, a simple page to add, rename and remove activities, linked from the Pomodoro page.
**Files**: `app/pomodoro/activities/page.tsx`, `app/pomodoro/activities/actions.ts`, `components/pomodoro/activity-form.tsx`, `components/pomodoro/activity-list.tsx`, `app/pomodoro/page.tsx`
**Acceptance criteria**:
- `/pomodoro` has a "Manage activities" link to the page, and the page links back.
- Typing a name and submitting adds the activity to the list without a full page reload; a blank or duplicate name shows an inline message and creates nothing.
- Rename updates the row; the same validation applies.
- Remove asks for confirmation with a text saying that Pomodoros already recorded for the activity are kept and still counted in the statistics; confirming takes the activity off the list.
- With no activities, the text "No activities yet" is shown.
- All changes remain after a page reload.
**Done notes**: Checked in Chrome: add, blank name, duplicate in another case, rename (including to a duplicate), remove with confirmation, and restoring a removed name. Both Pomodoro pages are `force-dynamic` so they read the database on every request.

### [x] Task 3.6: Choose an activity before starting a focus period
**Description**: Add an activity picker to the timer; a focus period cannot start without an activity, and the chosen activity travels with the running timer.
**Files**: `components/pomodoro/activity-picker.tsx`, `components/pomodoro/pomodoro-timer.tsx`, `hooks/use-pomodoro-timer.ts`, `lib/pomodoro/timer.ts`, `lib/pomodoro/timer.test.ts`, `app/pomodoro/page.tsx`, `components/ui/select.tsx`
**Acceptance criteria**:
- Before a focus period, the timer shows a picker listing the active activities. Start is disabled until one is chosen **(A-22)**.
- With no activities at all, Start is disabled and a message links to `/pomodoro/activities`.
- The activity used last time is preselected, also after a page reload; if it has since been removed, nothing is preselected **(A-23)**.
- While a focus period runs, the activity name is shown next to the countdown and cannot be changed **(A-23)**.
- The timer state saved in `localStorage` includes the activity id and name, so a reload during a focus period still shows the activity.
- Breaks need no activity: the picker is not shown and Start is enabled **(A-22)**.
- `npm test` exits with code 0.
**Done notes**: Checked in Chrome: Start disabled until an activity is chosen, the message with a link when there are no activities, the last-used activity preselected after a reload, and nothing preselected when the last-used id no longer exists.

### [x] Task 3.7: Run the timer app-wide and detect the end on time
**Description**: Move the timer into a provider mounted in the root layout so it runs in every section, add an "ended, waiting to be acknowledged" state for focus periods, and detect the end from the stored end timestamp even when the tab is in the background.
**Files**: `components/pomodoro/pomodoro-provider.tsx`, `lib/pomodoro/end-timer.worker.ts`, `hooks/use-pomodoro-timer.ts`, `lib/pomodoro/timer.ts`, `lib/pomodoro/timer.test.ts`, `components/pomodoro/pomodoro-timer.tsx`, `app/layout.tsx`
**Acceptance criteria**:
- The provider is the only place the timer runs; `/pomodoro`, `/habits` and `/exercise` all read the same timer state through it.
- The end of a phase is decided by comparing the current time with the stored `endsAt`, never by counting ticks. The check runs from one timeout aimed at `endsAt` hosted in a dedicated Web Worker (page timers are throttled in background tabs), and again whenever the tab becomes visible or gains focus.
- When a focus period ends the state becomes "ended" and is saved to `localStorage`; it stays "ended" across reloads until an `acknowledge` function is called, which moves to the break, stopped and waiting for Start **(A-6)**.
- When a break ends there is no "ended" state to acknowledge: the timer moves straight to "Focus 25:00", stopped and waiting for Start, with a small inline note "Break is over" on the timer.
- Timing check: start a focus period, switch to another tab and leave the app's tab hidden for the whole period (use the real 25 minutes at least once). The app logs the detection time to the console; it is within 5 seconds of `endsAt` in current desktop Chrome.
- If the computer was asleep or the browser closed at `endsAt`, the end is detected as soon as the page runs again.
- Unit tests cover the transitions running, ended, acknowledged for focus, and running to next phase for breaks; `npm test` exits with code 0.
**Done notes**: `PomodoroProvider` wraps the header and pages in the root layout and is the only place the end is detected; `usePomodoroTimer` now reads it through context and only adds the ticking countdown. `lib/pomodoro/timer.ts` and its tests needed no change (see Task 3.1). A new worker is created for each running phase and terminated when it ends; if the worker cannot be created, a page timeout is used instead. Checked in Chrome on `/habits` with the tab hidden and a focus period ending 6 seconds after a reload: the end was logged 6ms after `endsAt` and the saved state became "ended". The full 25-minute hidden-tab check has not been run yet.

### [ ] Task 3.8: Full-screen end-of-focus message
**Description**: Show a full-screen overlay (shadcn/ui Dialog) whenever a focus period is in the "ended" state, naming the activity and saying what comes next, with one button to continue.
**Files**: `components/pomodoro/phase-ended-overlay.tsx`, `components/pomodoro/pomodoro-provider.tsx`, `lib/pomodoro/messages.ts`
**Acceptance criteria**:
- When a focus period ends the overlay covers the whole app window, in whichever section the user is: check on `/pomodoro`, `/habits` and `/exercise`.
- The message names the activity and the next break, for example "Focus time is over: Read. Next: short break (5 minutes)", with a long-break variant after the 4th. The texts live in `lib/pomodoro/messages.ts`.
- No overlay appears when a break ends.
- The overlay closes only through its Continue button (not Escape, not a click outside). Continue calls `acknowledge` and leaves the break waiting for Start.
- If the focus period ended while the tab was hidden, the overlay is already showing when the user returns to the tab; it is also showing after a page reload.
- With the app open in two tabs, pressing Continue in one closes the overlay in the other.
- Keyboard focus moves to the Continue button when the overlay opens, and a screen reader announces the message.
- No sound is played.

### [ ] Task 3.9: Ask for notification permission on first Start
**Description**: Ask Chrome for permission to show desktop notifications the first time the user presses Start, and handle a refusal.
**Files**: `lib/pomodoro/notifications.ts`, `components/pomodoro/pomodoro-timer.tsx`, `components/pomodoro/notification-status.tsx`
**Acceptance criteria**:
- No permission prompt appears on page load. The prompt appears on the first click on Start while permission is still undecided, and the timer starts whatever the answer is.
- Once permission is granted or denied, pressing Start never prompts again.
- When permission is denied or unavailable, `/pomodoro` shows a short note: desktop notifications are off, the tab title will signal the end instead, and they can be enabled in Chrome's site settings. The app does not ask again by itself.
- `lib/pomodoro/notifications.ts` exports a function returning one of `granted`, `denied`, `default`, `unsupported`, and nothing throws when the Notification API is missing.
- Check all three outcomes by resetting the site permission in Chrome's site settings.

### [ ] Task 3.10: Desktop notification when a focus period ends out of sight
**Description**: When a focus period ends while the tab is hidden or the window is not focused, show a desktop notification with the same message as the overlay; clicking it brings the tab to the front.
**Files**: `lib/pomodoro/notifications.ts`, `components/pomodoro/pomodoro-provider.tsx`
**Acceptance criteria**:
- With permission granted and the app's tab hidden (another tab in front, or Chrome minimised), a desktop notification appears when the focus period ends, carrying the message from `lib/pomodoro/messages.ts` including the activity name.
- The notification appears within 5 seconds of `endsAt` after the tab has been hidden for the whole period (same check as Task 3.7, real 25 minutes at least once, current desktop Chrome).
- Clicking the notification calls `window.focus()` in its click handler and closes the notification; Chrome brings the app's tab to the front, where the overlay from Task 3.8 is showing. The tab does not come to the front without that click.
- No notification is shown when a break ends.
- No notification is shown when the tab is visible and focused at the end; the overlay alone is enough.
- With the app open in two tabs only one notification is visible (use the same notification `tag` in both).
- No service worker and no push server are used; nothing is shown if Chrome is closed **(A-21)**.

### [ ] Task 3.11: Tab title signal when notifications are not available
**Description**: When a focus period ends out of sight and notifications are denied, undecided or unavailable, change the tab title to a marker plus the message until the user returns.
**Files**: `lib/pomodoro/tab-title.ts`, `components/pomodoro/pomodoro-provider.tsx`
**Acceptance criteria**:
- With notification permission denied and the tab hidden, the tab title changes at the end of a focus period to a marker plus the message, for example "(!) Focus time is over: Read - Activity Tracker", readable in Chrome's tab strip.
- The original title comes back when the user returns to the tab and presses Continue on the overlay.
- The title is not changed when a break ends.
- Navigating between sections while the marker is set does not leave a wrong title behind after it is cleared.
- With permission granted the title is not changed; the notification from Task 3.10 is used instead.
- The standard checks pass.

### [ ] Task 3.12: Record a completed focus period
**Description**: Add the data function and server action that store a completed focus period against its activity, safely against duplicates.
**Files**: `lib/data/pomodoro.ts`, `app/pomodoro/actions.ts`, `lib/validation/pomodoro.ts`, `lib/validation/pomodoro.test.ts`
**Acceptance criteria**:
- The action accepts `activityId`, `startedAt`, `endedAt` and the local `date` (`YYYY-MM-DD`), validates them with zod, and rejects an unknown `activityId`, an `endedAt` that is before `startedAt`, or a duration longer than the configured focus length plus a small tolerance.
- An activity removed while its focus period was running is still accepted, so the finished Pomodoro is not lost.
- The write is an upsert on `startedAt`: calling the action twice with the same `startedAt` leaves exactly one row (check in `npx prisma studio`).
- The action calls `revalidatePath('/pomodoro')`.
- Unit tests cover the validation rules; `npm test` exits with code 0.

### [ ] Task 3.13: Save on completion and show today's count
**Description**: Call the record action from the app-wide provider when a focus period finishes, and show today's number of Pomodoros under the timer.
**Files**: `components/pomodoro/pomodoro-provider.tsx`, `components/pomodoro/pomodoro-timer.tsx`, `hooks/use-pomodoro-timer.ts`, `components/pomodoro/today-summary.tsx`, `app/pomodoro/page.tsx`, `lib/data/pomodoro.ts`
**Acceptance criteria**:
- When a focus period reaches 00:00 one `PomodoroSession` row is created with the chosen activity, whichever section the user is on and whether or not the overlay has been acknowledged; finishing a break creates none.
- If the tab was closed during a focus period and reopened after `endsAt`, the Pomodoro is recorded once with `endedAt` equal to `endsAt`.
- With the app open in two tabs, a finished focus period is still recorded only once.
- The page shows "Today: N pomodoros" using the user's local day (Task 2.1), and it updates without a manual reload after a focus period completes. Minutes are not shown: the unit is the count.
- If saving fails, an inline error message with a Retry button is shown and the Pomodoro is not silently lost.

### [ ] Task 3.14: Statistics queries and period grouping
**Description**: Add the data functions that count Pomodoros, and pure functions that group daily counts into days, weeks and months.
**Files**: `lib/data/pomodoro.ts`, `lib/pomodoro/stats.ts`, `lib/pomodoro/stats.test.ts`
**Acceptance criteria**:
- `lib/data/pomodoro.ts` has a function returning the all-time number of Pomodoros per activity (removed activities included) and a function returning the number of Pomodoros per `date` within a date range.
- `lib/pomodoro/stats.ts` has pure functions that take the per-date counts and the user's local today and return the last 14 days, the last 12 weeks and the last 12 months, each including the current one, newest first, with a label, a start day, an end day and a count; periods with no Pomodoros are present with count 0 **(A-27)**.
- A week runs Monday to Sunday **(A-26)**.
- Unit tests cover: a Sunday counted in the week that began the Monday before; a week that spans two months and one that spans two years; months of 28 and 31 days; zero-filled periods; the counts of every view adding up to the input for the covered range.
- `npm test` exits with code 0.

### [ ] Task 3.15: Totals per activity
**Description**: Show a plain table of how many Pomodoros have been completed for each activity.
**Files**: `components/pomodoro/activity-totals.tsx`, `app/pomodoro/page.tsx`
**Acceptance criteria**:
- `/pomodoro` shows a table with columns "Activity" and "Pomodoros", highest count first, then by name, with a total row at the bottom.
- Counts are all-time and do not follow the period selector of Task 3.16 (confirmed by the owner).
- Active activities with no Pomodoros are listed with 0. A removed activity is listed only if it has Pomodoros, with "(removed)" after its name **(A-24)**.
- After a focus period completes, the count for its activity goes up by one without a manual reload.
- With no activities, the text "No pomodoros recorded yet" is shown. It is a table, not a chart **(A-25)**.

### [ ] Task 3.16: Pomodoros per day, week and month
**Description**: Show a plain table of the number of Pomodoros per period, with a selector for Day, Week or Month.
**Files**: `components/pomodoro/period-counts.tsx`, `app/pomodoro/page.tsx`, `components/ui/tabs.tsx`
**Acceptance criteria**:
- `/pomodoro` shows a selector with Day, Week and Month (Day by default); the choice is kept in the URL (`?period=week`) and survives a reload.
- The table has columns "Period" and "Pomodoros", newest first: 14 rows for Day, 12 for Week, 12 for Month **(A-27)**. Labels are readable, for example "Mon 5 Oct", "5 Oct to 11 Oct", "October 2026". The current period is visually marked.
- Each count is the total across all activities; there is no breakdown per activity (confirmed by the owner, out of scope).
- Check with data: add `PomodoroSession` rows in `npx prisma studio` with dates in different weeks and months, and the three views show the expected counts.
- It is a table, not a chart, and no chart library is installed **(A-25)**.
- The standard checks pass.

---

## Phase 4: Habits (5 tasks)

Owner requirement: "It also tracks habits". Everything more specific below is an assumption.

### [ ] Task 4.1: Habit data functions and validation
**Description**: Implement the data functions for habits and completions, and the zod schemas for their input.
**Files**: `lib/data/habits.ts`, `lib/validation/habits.ts`, `lib/validation/habits.test.ts`
**Acceptance criteria**:
- Functions exist for: list habits with their completions in a date range, create, rename, delete, set a completion (habit, date, done true/false).
- Setting a completion is idempotent: marking done twice leaves one row, marking not-done twice leaves none.
- A habit name is trimmed, must be 1 to 80 characters, and a blank name is rejected.
- Unit tests cover the validation rules; `npm test` exits with code 0.

### [ ] Task 4.2: Habits page with list and create form
**Description**: Build `/habits` showing all habits and a form to add one.
**Files**: `app/habits/page.tsx`, `app/habits/actions.ts`, `components/habits/habit-form.tsx`, `components/habits/habit-list.tsx`
**Acceptance criteria**:
- Typing a name and submitting adds the habit to the list without a full page reload, and the input is cleared.
- Submitting a blank name shows an inline validation message and creates nothing.
- Habits are listed oldest first; with none, the text "No habits yet" is shown.
- Habits remain after a page reload.

### [ ] Task 4.3: Rename and delete a habit
**Description**: Add rename and delete actions to each habit row.
**Files**: `components/habits/habit-row.tsx`, `components/habits/habit-list.tsx`, `app/habits/actions.ts`
**Acceptance criteria**:
- Rename opens the name for editing; saving updates the row, and a blank name is rejected with a message.
- Delete opens a confirmation dialog stating that the habit's history is removed too; confirming removes the habit and its completions, cancelling changes nothing **(A-10)**.
- Both changes remain after a page reload.

### [ ] Task 4.4: Mark a habit done for today
**Description**: Add a checkbox to each habit row that marks it done or not done for the user's local today.
**Files**: `components/habits/habit-row.tsx`, `app/habits/actions.ts`, `app/habits/page.tsx`
**Acceptance criteria**:
- Ticking the checkbox creates a completion for today; unticking removes it. The state remains after a reload.
- "Today" follows the browser time zone (Task 2.1): with the `tz` cookie set to a zone where it is already the next day, the checkboxes show as unticked.
- The checkbox has an accessible label that includes the habit name and can be toggled with the keyboard.
- All habits are treated as daily, done or not done **(A-8)**.

### [ ] Task 4.5: Last-seven-days view per habit
**Description**: Extend each habit row to show the last 7 days, today last, each day as a checkbox that can be toggled, so past days can be reviewed and corrected.
**Files**: `components/habits/habit-row.tsx`, `components/habits/habit-list.tsx`, `app/habits/page.tsx`
**Acceptance criteria**:
- A header row shows the 7 dates (weekday and day number); today's column is visually marked.
- Ticking a past day creates a completion for that date; unticking removes it; both remain after a reload **(A-9)**.
- At 375px viewport width the 7 columns are usable with no horizontal page scrolling (the grid itself may scroll).
- No streak counters, percentages or charts are shown.
- The standard checks pass.

---

## Phase 5: Exercise (4 tasks)

Owner requirement: "It also tracks ... exercise.", confirmed by the owner as a "simple log". The exact fields of a log entry are still an assumption **(A-11)**.

### [ ] Task 5.1: Exercise data functions and validation
**Description**: Implement the data functions and zod schema for exercise entries.
**Files**: `lib/data/exercise.ts`, `lib/validation/exercise.ts`, `lib/validation/exercise.test.ts`
**Acceptance criteria**:
- Functions exist for: list entries (newest date first, then newest created first), create, update, delete.
- Validation: `activity` trimmed, 1 to 80 characters; `durationMinutes` a whole number from 1 to 1440; `date` a valid `YYYY-MM-DD` that is not after today; `notes` optional, at most 500 characters **(A-12)**.
- Unit tests cover each rule; `npm test` exits with code 0.

### [ ] Task 5.2: Log an exercise entry
**Description**: Build the form on `/exercise` to log an entry: date, activity, duration in minutes, optional notes.
**Files**: `app/exercise/page.tsx`, `app/exercise/actions.ts`, `components/exercise/exercise-form.tsx`
**Acceptance criteria**:
- The date field defaults to the user's local today.
- Submitting valid values creates the entry and clears the activity, duration and notes fields.
- Each invalid field shows its own inline message and nothing is saved.
- Every field has a visible label and the form can be completed with the keyboard only.

### [ ] Task 5.3: Exercise entry list
**Description**: List logged entries below the form.
**Files**: `components/exercise/exercise-list.tsx`, `app/exercise/page.tsx`
**Acceptance criteria**:
- Entries are grouped under a date heading, newest date first; each shows activity, duration and notes when present.
- A new entry appears in the list without a full page reload.
- The 50 most recent entries are shown **(A-13)**; with none, the text "No exercise logged yet" is shown.
- No totals, charts or statistics are shown.

### [ ] Task 5.4: Edit and delete an exercise entry
**Description**: Add edit and delete actions to each entry.
**Files**: `components/exercise/exercise-row.tsx`, `components/exercise/exercise-form.tsx`, `components/exercise/exercise-list.tsx`, `app/exercise/actions.ts`
**Acceptance criteria**:
- Edit opens the entry in a dialog reusing the form from Task 5.2 with the same validation; saving updates the list.
- Changing the date moves the entry to the correct date group.
- Delete asks for confirmation; confirming removes the entry, cancelling changes nothing.
- Changes remain after a page reload.
- The standard checks pass. This completes the app.

---

## Assumptions to confirm

None of the following was stated by the owner. Each is the simplest conventional behaviour chosen so the three requested features can work at all.

**Pomodoro**
- **A-1** Break lengths are the classic ones: 5 minutes short break, 15 minutes long break after every 4th focus period. (The 25-minute focus length is confirmed.)
- **A-2** Durations are fixed in code. There is no settings screen to change them.
- **A-3** Breaks are timed but not stored or counted.
- **A-4** A focus period that is cancelled before it ends records nothing (a pomodoro is all or nothing).
- **A-5** There is no pause button, only Start and Cancel.
- **A-6** After a focus period ends and the user presses Continue on the end message, the break waits for the user to press Start; it does not start by itself. The same applies to the focus period after a break.
- **A-7** Recorded Pomodoros cannot be added, edited, deleted or moved to another activity by hand.
- **A-21** "The screen should be focused" is delivered as the closest thing a web page can do: a full-screen message inside the app, a desktop notification that brings the tab forward when clicked, and a changed tab title when notifications are not allowed. This needs the app's tab left open in desktop Chrome; if Chrome or the tab is closed, the message appears the next time the app is opened.

**Activities**
- **A-22** An activity must be chosen before a focus period can start. Breaks belong to no activity.
- **A-23** The activity used last time is preselected, and the activity cannot be changed while a focus period is running.
- **A-24** Removing an activity does not delete anything already recorded: the activity disappears from the picker, its Pomodoros stay and are still counted in the statistics under its name, marked "(removed)". Activity names are unique, and creating an activity with a removed one's name brings that one back with its history.

**Statistics**
- **A-25** "Stack" in the owner's words is read as a tally: plain tables of counts, not a stacked chart.
- **A-26** A week runs Monday to Sunday.
- **A-27** The views show the last 14 days, the last 12 weeks and the last 12 months, including the current one; periods with no Pomodoros show 0.

**Habits**
- **A-8** A habit is just a name. Every habit is daily and each day is either done or not done: no weekly schedules, target counts, quantities or reminders.
- **A-9** The habits screen shows the last 7 days and any of those days can be ticked or unticked. Days older than that cannot be viewed or changed.
- **A-10** Deleting a habit permanently deletes its history. There is no archive.

**Exercise**
- **A-11** A simple-log entry has these fields: date, activity name (free text), duration in minutes, optional notes.
- **A-12** Exercise can be logged for today or a past date, not a future one; duration is 1 to 1440 whole minutes.
- **A-13** The exercise list shows the 50 most recent entries, with no paging, search or totals.
- **A-29** Habits and exercise are independent of Pomodoro activities: the exercise log's activity name is free text and is not linked to the activities defined for Pomodoros, and neither habits nor exercise appear in the Pomodoro statistics.

**Technical**
- **A-15** There is no dashboard or home screen; `/` opens the Pomodoro section.
- **A-16** A "day" is the calendar day in the time zone of the browser being used. The interface is in English only.
- **A-17** Unit tests (Vitest) cover pure logic only. There are no end-to-end browser tests.
- **A-18** Hosting and deployment are not planned here; the tasks end with an app that runs locally and builds cleanly.

## Too vague to turn into tasks (owner input needed)

- **What the owner wants to see from tracked habits and exercise.** The Pomodoro statistics are now defined. For habits and exercise, "tracks" implies being able to look back, so each has one plain history view; whether totals or any reporting is wanted there is unknown and nothing of that kind is planned.
- **Truly forcing the window to the front.** A web app cannot bring its own tab or window to the foreground by itself; browsers block it. If the owner needs the window to jump in front of whatever they are doing, with no click, the app would have to be wrapped as a desktop application (Electron or Tauri). That is out of scope unless the owner asks for it.
- **Whether the three features relate to each other.** For example, whether an exercise session should also count as a habit or as a Pomodoro activity (see A-29). They are planned as three independent sections.
- **Where it runs** (see A-18): on the owner's own machine, or hosted so the owner can reach it from several devices. Because there is no login, a hosted copy on a public address would let anyone who finds the URL read and change the data, so hosting needs some access restriction that is not planned here. With SQLite the data is one file on the machine that runs the app, so a hosted copy also needs a host with a persistent disk; serverless hosts that discard local files would lose the data.

## Quality Requirements

- [ ] TypeScript strict mode stays on; no `any` and no `@ts-ignore` without a comment explaining why
- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass at the end of every phase
- [ ] Only shadcn/ui components and Tailwind utilities for UI; no additional UI library
- [ ] Every page works in light and dark themes and at 375px width
- [ ] Forms have visible labels, inline validation messages and work with the keyboard
- [ ] Database queries live in `lib/data/`; pages and components do not use the Prisma client directly
- [ ] No accounts, login or per-user data: single-user is a confirmed requirement
- [ ] No background processes or extra services: only the Next.js app with its SQLite file (no database server, no service worker, no push server)
- [ ] The SQLite database file is never committed to git
- [ ] The end of a Pomodoro phase is always computed from the stored end timestamp, never by counting ticks
- [ ] No feature outside the owner's stated requirements is added without the owner asking for it

## Technical Notes

**Development stack**: Next.js (App Router), React, TypeScript strict, Node.js, Tailwind CSS, shadcn/ui, next-themes, Prisma, SQLite, zod for input validation, Vitest for unit tests.
**Not used**: Laravel, Livewire, FluxUI, Blade, Alpine.js, PHP of any kind.
**Special instructions**: stick to the exact spec; anything marked (A-n) is provisional until the owner confirms it.
**Timeline expectations**: 36 tasks at 30 to 60 minutes each is roughly 18 to 36 developer-hours before review and rework; expect two or three revision rounds once the owner has seen the first version and answered the assumptions.
