## Context

See `proposal.md` for motivation. Relevant current state:

- No authenticated route exists yet — only `src/app/(auth)/{login,signup}` and the marketing
  `src/app/page.tsx`. `(auth)/layout.tsx` does not itself guard anything (login/signup must stay
  reachable while logged out); there is no existing session-guard pattern in the repo to copy.
- Better-Auth is configured in `src/lib/auth.ts` (`auth`), route handler at
  `src/app/api/auth/[...all]/route.ts`, client at `src/features/auth/client.tsx` (`authClient`).
  Server-side session reads use Better-Auth's own API (`auth.api.getSession({ headers })`), not a
  DB query — nothing in this change touches `src/lib/auth.ts` or the Prisma schema.
- `components.json` already pins `style: "base-nova"` (a Base UI-backed shadcn style, not Radix —
  the repo already depends on `@base-ui/react`) and `baseColor: "neutral"`. Any shadcn component
  added here (`sidebar`, `dropdown-menu`, `avatar`, `separator`, `tooltip`, `sheet`, `skeleton`)
  installs through that same style, not a Radix-based one.
- Reference material: a Figma wireframe (file "Slotly") shows a Linear-style two-tier sidebar —
  icon rail + expanded panel with a workspace-switcher header, search, grouped nav ("Favorites",
  "Records"), a promo card, and a user-profile row that opens two popovers (workspace switcher,
  user menu). Research into shadcn's own `sidebar-09`/`sidebar-07` blocks and two real projects
  (Rallly, Dub) confirmed this is a standard, well-supported layout shape — see Decisions below
  for what's kept vs. adapted.

## Goals / Non-Goals

**Goals:**
- A session-guarded route group (`app/(app)/`) that every future authenticated page (Availability,
  Bookings, Settings...) mounts under, without re-implementing the guard.
- A sidebar shell — icon rail + panel, collapsible, state persisted — built from shadcn's existing
  `Sidebar` primitives rather than hand-rolled.
- A place for nav *items* to live that isn't the shell component itself, so adding a destination
  later (Availability's own change, etc.) doesn't require editing shell code.
- A user menu (avatar, name/email, sign out) wired to the real Better-Auth session.

**Non-Goals:**
- No multi-workspace/account switcher — Slotly has one host per session, no orgs/teams
  (`docs/vision.md`). The Figma reference's workspace-switcher popover and "+ New account" are
  dropped entirely, not stubbed.
- No global search, no "Favorites"/"Records" grouped sections, no promo/update card — these come
  from the reference screenshot's source app (a CRM/Linear-style tool) and don't correspond to any
  Slotly capability. Only structural patterns are borrowed, not literal content.
- No real nav destinations beyond a placeholder home. Availability (and later features) register
  their own nav entries and pages in their own changes.
- No notification center, command palette, or theme switcher, even though visually adjacent in
  Linear-style shells — nothing in `docs/vision.md`/`docs/roadmap.md` calls for them.

## Decisions

**1. Route group `app/(app)/` with a server-side guard in `layout.tsx`.**
`layout.tsx` calls `auth.api.getSession({ headers: await headers() })`; no session → `redirect("/login")`.
Mirrors how `(auth)` is already a route group for the logged-out shell; keeps `app/` thin per
`CLAUDE.md` ("routing only"). Alternative considered: Next.js middleware — rejected because
middleware can't easily reuse Better-Auth's server session helper without extra edge-runtime
config, and a layout-level check is simpler for a single guarded route group.

**2. Shell = a single shadcn `<Sidebar collapsible="icon">` (the `sidebar-07` shape), not the
nested `sidebar-09` icon-rail.**
Revised from the original plan during implementation: `sidebar-09`'s nested icon-rail is for
switching between *independent* panels with different content each (e.g. a mail app's
Inbox/Drafts/Sent, each its own list) — that's not what the Figma reference actually shows. Its
"icon rail" and "expanded panel" render the *same* nav list, just icon-only vs. labeled — exactly
what a single `<Sidebar collapsible="icon">` already gives for free (icon-only rail + tooltips
when collapsed, labeled items when expanded), with no second independent panel needed.
`SidebarProvider` + `AppSidebar` + `SidebarInset` compose in `app/(app)/layout.tsx`, matching how
shadcn examples and both reference repos (Rallly, Dub) wire the provider at the authenticated
route-group layout, not in the root `app/layout.tsx`.

**3. Collapsed state persisted via shadcn's built-in cookie, read server-side.**
`SidebarProvider` already writes a `sidebar_state` cookie on toggle. `app/(app)/layout.tsx` reads
it (`cookies()`) and passes `defaultOpen` into `SidebarProvider`, avoiding an expand-then-collapse
flash on reload — no custom persistence needed.

**4. Nav items live in `features/navigation/`; `AppSidebar` itself lives there too, not in
`components/`.**
A `features/navigation/client.tsx` hook (`useAppNav()`) returns the grouped item list.
`AppSidebar` (`features/navigation/components/app-sidebar.tsx`) calls that hook directly to render
groups/items — which means it cannot live in `components/`: the repo's Biome config already lints
`noRestrictedImports` to reject any `components/*` file importing from `features/*` (caught this
during implementation, confirming the rule is enforced, not just documented in `CLAUDE.md`). Only
the underlying shadcn `Sidebar`/`SidebarMenu`/etc. primitives stay generic in `components/ui/`;
the composed, nav-aware `AppSidebar` is feature-owned UI — allowed per `CLAUDE.md`'s "or a
`components/` folder inside another feature" rule. This still follows Rallly's
`features/navigation/client.tsx` → `useSpaceMenu()` split and Dub's `groups`/`areas` config
pattern for keeping "what shows and when" out of the primitive layer. For this change the list has
exactly one entry (a placeholder home) — the registry exists so Availability's change adds an
entry, not a shell edit.

**5. User menu is a separate component (`NavUser`) in `features/auth/components/`, not inlined in
the shell.**
It reads the session via `authClient.useSession()` and calls `authClient.signOut()`, so it depends
on `features/auth` — meaning it cannot live in `components/` (which never imports `features/`).
Matches the shadcn `sidebar-07` `nav-user.tsx` pattern and Dub's separate `user-dropdown.tsx`:
the generic `SidebarFooter`/`SidebarMenuButton` chrome is shadcn/`components/`, the
session-reading content is feature-owned.

**6. New shadcn components added as listed in `proposal.md`'s Impact section**
(`sidebar dropdown-menu avatar separator tooltip sheet skeleton`) — all through `bunx shadcn add`,
consistent with `CLAUDE.md`'s MVP rule to use shadcn as-is; no bare npm package is added beyond
what those pull in transitively.

## Risks / Trade-offs

- **[Risk]** A session guard duplicated only in `app/(app)/layout.tsx` could drift if another
  authenticated route group is added later. → **Mitigation**: none needed yet (single guarded
  route group); revisit if/when a second one appears.
- **[Risk]** Building the nav registry for a single placeholder item is speculative structure for
  a shell change that otherwise ships no real destinations. → **Mitigation**: the registry is a
  small hook returning a literal array, not a generalized plugin system — cheap enough to justify
  given three concrete features (Availability, Bookings, Settings) are already roadmapped to need
  it shortly (`docs/roadmap.md`).
- **[Risk]** shadcn's `base-nova`/Base UI style may render the `sidebar-09` reference block
  slightly differently than the Radix-based examples in shadcn's own docs (different underlying
  primitives for `Sheet`/`Tooltip`/`DropdownMenu`). → **Mitigation**: `bunx shadcn add` resolves
  the correct variant for the project's configured style automatically; visually verify collapse/
  mobile-drawer/tooltip behavior after install rather than assuming doc examples transfer exactly.

## Open Questions

- Exact copy/icon for the single placeholder nav entry (e.g. "Overview" vs. going straight to
  what will become the Availability page's route) — cosmetic, decide during implementation without
  affecting the spec or task breakdown.
