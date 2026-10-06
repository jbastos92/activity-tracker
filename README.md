# Activity Tracker

A single-user web app that tracks work time with the Pomodoro pattern, plus habits and exercise.

The task list and requirements are in `ai/memory-bank/tasks/activity-tracker-tasklist.md`.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, next-themes, Prisma with SQLite, Vitest.

## Run it locally

Requires Node.js 22 or newer.

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000.

## Database

The data lives in one SQLite file, `dev.db`, in the project root. Its location comes from `DATABASE_URL` in `.env` (`file:./dev.db`).

- There is no database server to install or run.
- To back up your data, copy `dev.db`. Losing that file loses all tracked data.
- `dev.db` and `.env` are git-ignored and must never be committed.

`npx prisma migrate deploy` creates `dev.db` if it is missing and applies the migrations in `prisma/migrations`.

The Prisma client is generated into `lib/generated/prisma` by `npm install`. After changing `prisma/schema.prisma`, run `npx prisma migrate dev --name <change>` and then `npx prisma generate` (Prisma 7 no longer generates the client as part of a migration).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm test` | Run the unit tests once (Vitest) |
