## Context

See `proposal.md` for motivation and `docs/availability.md` for the business analysis (competitor
comparison, scope decisions, timezone rule) this design implements. Relevant current state:

- `prisma/schema.prisma` only has the Better-Auth-generated `User`/`Session`/`Account`/
  `Verification` models — no Availability entities exist yet, and `roadmap.md`'s original
  `AvailabilityRule` guess predates the override/buffer/min-notice/max-advance scope decisions made
  in `docs/availability.md`, so the model set below extends that guess rather than matching it
  verbatim.
- The authenticated app shell and nav registry (`features/navigation/client.tsx`'s `useAppNav()`)
  already exist from `add-dashboard-shell` — adding a destination is a data change to that hook, not
  a shell edit.
- `CLAUDE.md`'s per-feature file convention (`data.ts`/`loaders.ts`/`mutations.ts`/`actions.ts`/
  `schema.ts`) and layering (`data.ts`/`mutations.ts` are the only files touching the DB client
  directly, `actions.ts` is the only place doing auth/authorization) governs the server layer below.

## Goals / Non-Goals

**Goals:**
- Data model for weekly recurring rules, date overrides, and per-host guardrail settings (buffer,
  min notice, max advance), matching every requirement in
  `specs/availability/schedule/spec.md`.
- A server layer that enforces "a host only ever reads/writes their own availability" and the
  overlap/override-precedence rules server-side, not just in the UI.
- A management page under the existing app shell where a host edits all of the above.

**Non-Goals:**
- Computing actual bookable slots (weekly rules ⊖ overrides ⊖ bookings ⊖ buffer) — that's Booking,
  Phase 2; this change only stores and serves the rules.
- Google Calendar busy-time integration — Phase 4.
- Multiple named schedules per event type, per-day booking caps, or slot-priority ordering — all
  explicitly out of scope per `docs/availability.md`'s "Ngoài phạm vi Phase 1".

## Decisions

**1. Three new Prisma models, no changes to `User`.**
```prisma
model AvailabilityRule {
  id          String   @id @default(cuid())
  userId      String
  dayOfWeek   Int      // 0 (Sun) – 6 (Sat)
  startMinute Int      // minutes from local midnight, 0–1439
  endMinute   Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, dayOfWeek])
}

model AvailabilityOverride {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  isBlocked Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  blocks    AvailabilityOverrideBlock[]

  @@unique([userId, date])
}

model AvailabilityOverrideBlock {
  id          String               @id @default(cuid())
  overrideId  String
  startMinute Int
  endMinute   Int
  override    AvailabilityOverride @relation(fields: [overrideId], references: [id], onDelete: Cascade)
}

model AvailabilitySettings {
  id                  String  @id @default(cuid())
  userId              String  @unique
  timezone            String  // IANA id, e.g. "Asia/Ho_Chi_Minh"
  bufferBeforeMinutes Int     @default(0)
  bufferAfterMinutes  Int     @default(0)
  minNoticeHours       Int     @default(0)
  maxAdvanceDays        Int?    // null = unlimited
  user                User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
- **Time as minutes-from-midnight (`Int`), not `DateTime`.** These are recurring *local* times with
  no fixed calendar date; forcing them into `DateTime` invites an arbitrary epoch date and the exact
  UTC-conversion bugs `docs/availability.md`/`vision.md` call non-negotiable to avoid. An int is
  also trivially comparable for the overlap check below, no string parsing needed. Alternative
  considered: `"HH:mm"` string — rejected for the same overlap-comparison reason.
- **`AvailabilityOverride` (date + `isBlocked`) with a separate `AvailabilityOverrideBlock` child
  table**, mirroring the weekly-rule/day-of-week shape: zero block rows when `isBlocked`, one or
  more when the date has custom hours. Keeps "a date's override fully replaces its weekly rule"
  (spec requirement) a matter of "look up the override row for this date; if present, ignore
  `AvailabilityRule` entirely" — no merge logic.
- **`AvailabilitySettings` as its own 1:1 table, not columns on `User`.** `User` is Better-Auth-
  generated (`npx @better-auth/cli generate` rewrites its Availability-unrelated shape whenever auth
  config changes); keeping availability's own scalar settings in a table the `availability` feature
  owns avoids that generator ever touching or conflicting with them, and matches `CLAUDE.md`'s
  feature-ownership rule. Trade-off: one extra join per read — negligible for a single-row lookup.
- Timezone lives once on `AvailabilitySettings`, not per-rule/override — a host has one timezone at
  a time; existing rules/overrides are always interpreted against the *current* settings value
  (spec's "Host changes their timezone" scenario — reinterpreted, not migrated/rewritten).

**2. Overlap validation in application code, inside the same transaction as the write — not a DB
constraint.** A Postgres `EXCLUDE USING gist` constraint would be the airtight option (same spirit
as the DB-level double-booking constraint `vision.md` requires for Booking), but Prisma 7 has no
first-party support for exclusion constraints without hand-editing generated migration SQL, and
unlike double-booking, weekly-rule overlap is a single-actor data-entry validation (a host mistyping
their own hours), not a concurrency race — no two requests can race to write the same host's rules
under Slotly's one-host-per-session model. Re-evaluate only if Availability ever gains concurrent
editors of the same host's schedule, which nothing in the roadmap calls for.

**3. Server layer follows `CLAUDE.md`'s file convention exactly:**
- `data.ts`: explicit-param reads (`getRules(userId)`, `getOverrides(userId, range?)`,
  `getSettings(userId)`) — never reads session.
- `loaders.ts`: resolves the session, then calls `data.ts` — used by the availability page's server
  component to fetch the current host's own data.
- `mutations.ts`: explicit-param writes (`createRule`, `updateRule`, `deleteRule`, `upsertOverride`,
  `deleteOverride`, `updateSettings`), each taking `userId` as an explicit argument, never reading
  session — this is where the overlap check runs, inside the write transaction.
- `actions.ts`: `"use server"` — the only place resolving the session and checking it matches the
  data being written; thin wrappers around `mutations.ts`. This is what enforces the spec's
  "Availability is private to its host" requirement.
- `schema.ts`: Zod input schemas for rule/override/settings, including a `superRefine` overlap check
  for immediate client-side feedback — `mutations.ts` re-runs the authoritative check regardless,
  since client validation is never trusted alone.

**4. UI: one thin route, one feature-owned client component.**
`app/(app)/availability/page.tsx` is a server component (per `CLAUDE.md`, "routing only") that calls
`loaders.ts` and renders a client component from `features/availability/components/` owning the
weekly grid, override list, and settings form. Forms call Server Actions directly
(`useActionState`/optimistic UI), matching the pattern already used by `features/auth`'s
login/signup forms — no new client-state library.

**5. Nav integration is a one-line data change.** Add one entry to
`features/navigation/client.tsx`'s `useAppNav()` pointing at `/availability` — the registry exists
precisely so this doesn't touch shell code (`add-dashboard-shell`'s design.md, decision 4).

**6. New shadcn primitives are likely needed** (time input, switch, date picker for overrides,
select) — exact list finalized in `tasks.md` and confirmed with the user before running
`bunx shadcn add`, per `CLAUDE.md`'s "never add a dependency without asking first."

## Risks / Trade-offs

- **[Risk]** Overlap validation only at the app layer could let overlapping rules slip in through a
  future write path that forgets to call `mutations.ts`. → **Mitigation**: `data.ts`/`mutations.ts`
  are the only files allowed to import the DB client (`CLAUDE.md`), so there is no alternate write
  path today; revisit with a DB constraint only if that stops being true.
- **[Risk]** Minutes-from-midnight is less human-readable than a time column when inspecting the DB
  directly. → **Mitigation**: trivial to format at the UI boundary; avoids the larger DateTime/UTC
  conversion risk.
- **[Risk]** `AvailabilitySettings` as a separate table adds a join on every settings read. →
  **Mitigation**: single-row-per-host lookup, negligible cost; keeps `User` untouched by this
  feature.

## Migration Plan

Purely additive — four new tables (`AvailabilityRule`, `AvailabilityOverride`,
`AvailabilityOverrideBlock`, `AvailabilitySettings`), no changes to existing auth tables, no
backfill needed (no Availability data exists yet). `prisma migrate dev` after the schema edit.
Fully reversible by dropping the new tables — nothing else depends on them yet.
