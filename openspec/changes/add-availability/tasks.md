## 1. Data model

- [x] 1.1 Add `AvailabilityRule`, `AvailabilityOverride`, `AvailabilityOverrideBlock`, and
  `AvailabilitySettings` models to `prisma/schema.prisma` per `design.md`'s Decision 1, including
  the `userId` relations to `User` and the `@@unique([userId, date])`/`@@index([userId, dayOfWeek])`
  constraints; verify `bunx prisma validate` passes.
- [x] 1.2 Run `bunx prisma migrate dev` to create the migration and apply it to the dev DB; verify
  the four new tables exist (`bunx prisma studio` or a direct query) and `bun run build` still
  succeeds (generated client picks up the new models).

## 2. Server layer (`src/features/availability/`)

- [x] 2.1 Create `schema.ts` with Zod schemas for a weekly rule, an override (blocked or custom
  hours), and settings (timezone, buffers, min notice, max advance), including a `superRefine`
  overlap check for same-day rule blocks; verify with unit tests covering an overlapping pair
  rejected and a non-overlapping pair accepted. No test framework exists in the repo yet (no
  vitest/jest dependency) — verified instead with an ad-hoc `bun run` script exercising
  `overrideInputSchema`/`ruleInputSchema` directly (overlapping blocks rejected, non-overlapping
  accepted, bad time order rejected), then deleted; not added as a permanent test per the
  dependency rule in `CLAUDE.md`.
- [x] 2.2 Create `data.ts` with explicit-`userId`-param reads: `getRules`, `getOverrides`,
  `getSettings`; verify each returns an empty result (not an error) for a host with nothing
  configured yet, matching the spec's "Host with no availability configured" scenario.
- [x] 2.3 Create `mutations.ts` with explicit-`userId`-param writes: `createRule`, `updateRule`,
  `deleteRule`, `upsertOverride` (replaces any existing blocks for that date), `deleteOverride`,
  `updateSettings`; the rule create/update path re-runs the overlap check inside the same
  transaction as the write (`design.md` Decision 2); verify by writing an overlapping rule directly
  through `mutations.ts` and confirming it throws. Verified via the same ad-hoc script: a second
  overlapping rule against an existing DB row threw, a non-overlapping one succeeded.
- [x] 2.4 Create `loaders.ts` resolving the current session then calling `data.ts` for that host's
  own rules/overrides/settings; verify it throws/redirects when there is no session.
- [x] 2.5 Create `actions.ts` (`"use server"`) wrapping every `mutations.ts` call with a session
  check that the resolved `userId` matches the data being written; verify a request with no session
  is rejected and a request for another host's `userId` is rejected, matching the spec's "Host
  attempts overlapping" and "Availability is private to its host" requirements. Every action derives
  `userId` solely from `auth.api.getSession()` and never accepts it as a client-supplied argument,
  so there is no "match" to check — a request cannot target another host's data structurally, and a
  missing session throws before any mutation runs. Verified by code review (`bunx tsc --noEmit`
  confirms no action signature accepts `userId` from its input).

## 3. UI components

- [x] 3.1 Confirm the exact shadcn component list (candidates from `design.md`: time input/select,
  `switch`, `calendar`, `button`, `label`, `card`) with the user, then run `bunx shadcn add <list>`;
  verify components land under `src/components/ui/` and `bun run lint` still passes. Confirmed with
  the user that no new component was actually required — `button`/`input`/`label`/`form` already
  exist and native `<input type="time">`/`<input type="date">`/`<select>` cover the rest; only
  `card` was added (for section grouping), which added a single source file and zero new npm
  packages (`git diff package.json` empty). `bun run lint` passes after `bun run check` auto-fixed
  the generated file's class-sort/import-order style.
- [x] 3.2 Create `src/features/availability/components/weekly-schedule.tsx` (client) rendering the
  7-day grid with add/edit/remove time-block controls per day, calling the `createRule`/
  `updateRule`/`deleteRule` actions; verify adding a second non-overlapping block on the same day
  succeeds and an overlapping one shows a validation error without a round trip failing silently.
  Verified live in browser (task 5.1): Monday and Tuesday blocks saved and displayed correctly;
  adding a second Tuesday block exactly overlapping the first showed the toast "Time block overlaps
  an existing block on this day" and left the draft row editable rather than failing silently;
  deleting a rule correctly reverted that day to "Unavailable".
- [x] 3.3 Create `src/features/availability/components/overrides-list.tsx` (client) for adding a
  date override (block entirely or custom hours) and removing one, calling `upsertOverride`/
  `deleteOverride`; verify blocking a date visually replaces that date's weekly hours in the same
  view, and removing the override restores them. Verified live in browser: added a "Block day"
  override and a separate "Custom hours" override (09:00–17:00), both rendered correctly formatted
  in the list; deleting both returned the list to "No overrides yet."
- [x] 3.4 Create `src/features/availability/components/settings-form.tsx` (client) for timezone,
  buffer before/after, min notice, and max advance, calling `updateSettings`; verify saved values
  persist across a page reload. Verified live in browser: set buffer 10/15, min notice 24, max
  advance 60, timezone America/New_York; a full page reload showed all five values unchanged.

## 4. Route & navigation

- [x] 4.1 Create `src/app/(app)/availability/page.tsx` as a thin server component calling
  `loaders.ts` and rendering the three components from task 3; verify it renders inside the existing
  app shell (sidebar + content both visible) and redirects to `/login` when requested without a
  session. Shell rendering verified live (sidebar + content both visible). The no-session redirect
  is enforced first by `app/(app)/layout.tsx`'s existing guard (from `add-dashboard-shell`) before
  this page's own `loaders.ts` check would even run — not re-verified live here since that guard's
  behavior is already covered by that change's own tasks; `loaders.ts`'s own `redirect("/login")` is
  the same call pattern, verified by code review.
- [x] 4.2 Add an "Availability" entry to `useAppNav()` in `src/features/navigation/client.tsx`
  pointing at `/availability`; verify the sidebar shows the new entry and marks it active on that
  route, with no other shell code changed. Verified live: the sidebar shows "Availability" below
  "Overview" and highlights it while on that route; `app-sidebar.tsx`/shell code untouched (only
  `client.tsx`'s nav array edited).

## 5. End-to-end verification

- [x] 5.1 Walk the full flow in a browser as a signed-in host: add weekly blocks across multiple
  days including two blocks on one day, add a blocked-date override and a custom-hours override,
  set buffer/min-notice/max-advance, reload and confirm everything persisted exactly as entered.
  Walked live end-to-end (see notes on 3.2–3.4); one non-issue found during the walk: the very first
  screenshot taken immediately (1s) after clicking Save showed the old "Unavailable" state — this
  was purely Next.js Server Action + `revalidatePath` round-trip latency in dev mode (confirmed the
  row was already correctly persisted in the DB at that point), not a bug; later saves with a longer
  wait, and every hard reload, showed correct data.
- [x] 5.2 Confirm timezone integrity: change the host's timezone setting and verify existing weekly
  rules/overrides are still interpreted as that same local time in the new timezone (no silent
  UTC-offset shift), matching the spec's "Host changes their timezone" scenario. Verified live:
  switched timezone from Asia/Saigon to America/New_York and saved; Monday/Tuesday weekly blocks
  still showed 09:00 AM–05:00 PM unchanged, confirming minutes-from-midnight storage is unaffected
  by the timezone field. All test data (rules/overrides/settings) created on the dev account during
  this walkthrough was deleted afterward to leave it in its original empty state.
- [x] 5.3 Run `bun run lint` and `bun run build` and confirm both pass. Both pass with only the
  three pre-existing, unrelated notices (Biome config deprecation, `prisma7.config.ts` literal-key
  suggestion, `sidebar.tsx`'s `document.cookie` warning from `add-dashboard-shell`); zero new
  findings from this change's files.
