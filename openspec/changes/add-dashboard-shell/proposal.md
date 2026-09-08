## Why

Every feature after login (Availability first, then Bookings, Settings, Calendar sync...) needs
somewhere to live once a host is authenticated. Right now there is no authenticated route at
all — only `(auth)/login` and `(auth)/signup` exist. Building the shell now, as its own change,
means the upcoming Availability change (`docs/roadmap.md` Phase 1) drops its UI into an existing
layout instead of inventing routing/navigation ad hoc.

## What Changes

- New authenticated route group `app/(app)/` with a layout that redirects to `/login` when there
  is no session (mirrors the guard already implied by `(auth)/layout.tsx`).
- New app shell: a shadcn/ui `Sidebar` (block `sidebar-09` pattern) with a two-tier layout — a
  collapsible icon-only rail plus a wider panel with grouped nav sections — composed in that
  layout file.
- New `features/navigation/` module owning the nav item list as data (which links show, in what
  section), independent of which feature they point to, following the pattern used by Rallly
  (`features/navigation/client.tsx` → `useSpaceMenu()`) and Dub (`groups`/`areas` config)
  referenced in `design.md`.
- A user menu popover (avatar + name/email from the existing Better-Auth session, sign-out action)
  in the sidebar footer, adapted from the shadcn `nav-user.tsx` pattern.
- **Adaptation, not a straight port**: the Figma reference includes a multi-workspace/account
  switcher popover (switching between "DesignHub", "Vortex Innovations", etc.). Slotly has no
  workspace/org/team concept (`docs/vision.md` — "Cố tình không làm: team/round-robin
  scheduling") — one host per session, no multi-tenant switching. That popover is **dropped**,
  not implemented as a dead stub. The sidebar footer keeps only the single-user profile menu.
- No new pages of real content — the route group ships with a minimal placeholder home so the
  shell can be reviewed/tested end-to-end; Availability (and later features) add their own pages
  under `app/(app)/` in their own changes.

## Capabilities

### New Capabilities
- `navigation/app-shell`: the authenticated app shell — session-guarded route group, collapsible
  sidebar (icon rail + panel), nav item registry, and the user profile menu.

### Modified Capabilities
(none — this change consumes the existing `auth` session/client as-is; no auth requirement
changes)

## Impact

- **Routes**: new `src/app/(app)/layout.tsx` (session guard + shell composition),
  `src/app/(app)/page.tsx` (placeholder home).
- **New feature module**: `src/features/navigation/` (`client.tsx` nav-config hook, `types.ts`).
- **New shared UI** (`src/components/`): shadcn `Sidebar` primitives plus a project-specific
  `AppSidebar`, `NavUser` (user menu), pulled in via `bunx shadcn add sidebar dropdown-menu avatar
  separator tooltip sheet skeleton` — no bare npm packages beyond what those shadcn components
  bring in (confirm exact list in `tasks.md` before running).
- **Consumes**: `src/features/auth/client.tsx` (`authClient`) for session read + sign-out; no
  changes to `src/lib/auth.ts` or the Prisma schema.
- **No DB schema changes.**
