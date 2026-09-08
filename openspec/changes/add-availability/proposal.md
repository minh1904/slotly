## Why

Phase 1 of `docs/roadmap.md` needs two things before any booking can exist: a signed-in host, and a
place for that host to define when they can be booked. Auth already ships. This change delivers the
second half — the host-facing Availability feature (weekly recurring hours, date overrides, buffer,
min notice, max advance window) — backed by the business analysis already captured in
`docs/availability.md`. Nothing downstream (Booking, Phase 2) can start without this: Booking reads
these rules to compute real slots, it doesn't define them.

## What Changes

- New DB entities owned by the `availability` feature: recurring weekly rules (multiple time blocks
  per day of week) and date-specific overrides (block a day entirely, or replace its hours for that
  date only), plus per-host scalar settings (timezone, buffer before/after, minimum notice, maximum
  advance booking window) — exact shape decided in `design.md`.
- Server-side layer (`data.ts`/`mutations.ts`/`actions.ts`) for reading and writing a host's own
  availability — no cross-host access, every mutation scoped to the authenticated session.
- A new authenticated page (`app/(app)/availability`) where the host manages their weekly hours,
  overrides, and the buffer/min-notice/max-advance settings, wired into the existing app shell's nav
  registry (`features/navigation`) added in the `add-dashboard-shell` change.
- Server-side validation matching the business rules in `docs/availability.md`: no overlapping time
  blocks on the same day, overrides fully replace (not merge with) the weekly rule for their date,
  timezone stored as host-local time + IANA timezone id (never a bare UTC offset).

## Capabilities

### New Capabilities
- `availability/schedule`: host-configurable availability — weekly recurring rules, date overrides,
  buffer/min-notice/max-advance settings, and the management UI, scoped to the authenticated host.

### Modified Capabilities
(none — this change adds a new nav destination to the existing app shell via data, not a
requirement change to `navigation/app-shell`; no auth requirement changes)

## Impact

- **DB**: new Prisma models under the `availability` feature (weekly rule, override, per-host
  settings — finalized in `design.md`) + `prisma migrate dev`.
- **New feature module**: `src/features/availability/` (`data.ts`, `mutations.ts`, `actions.ts`,
  `loaders.ts`, `schema.ts`, `types.ts`, `components/`).
- **Routes**: new `src/app/(app)/availability/page.tsx`, thin per `CLAUDE.md` ("routing only").
- **Consumes**: `src/lib/auth.ts` session (read-only, via `loaders.ts`/`actions.ts`), the existing
  app shell and nav registry from `add-dashboard-shell` (adds one entry, no shell changes).
- **New shared UI**: likely new shadcn primitives (time input, switch, date picker for overrides) —
  exact list decided in `design.md`/`tasks.md` and confirmed with the user before running
  `bunx shadcn add`, per `CLAUDE.md`'s dependency rule.
- **No changes** to `src/lib/auth.ts`, `User`/`Session`/`Account`/`Verification` tables, or the
  Booking/Calendar-sync features (not started yet).
