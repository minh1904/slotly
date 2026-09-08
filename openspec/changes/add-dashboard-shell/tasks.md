## 1. Install shadcn primitives

- [x] 1.1 Run `bunx shadcn add sidebar dropdown-menu avatar separator tooltip sheet skeleton` and
  verify the components land under `src/components/ui/` and `bun run lint` still passes.

## 2. Session-guarded route group

- [x] 2.1 Create `src/app/(app)/layout.tsx` that reads the Better-Auth session server-side
  (`auth.api.getSession({ headers: await headers() })`) and redirects to `/login` when there is no
  session; verify by requesting a shell route while logged out and confirming the redirect.
- [x] 2.2 In that layout, read the `sidebar_state` cookie (`cookies()`) and pass it into
  `SidebarProvider`'s `defaultOpen`; verify by toggling the sidebar, reloading, and confirming it
  renders already in the toggled state with no expand-then-collapse flash.

## 3. Nav registry (`features/navigation`)

- [x] 3.1 Create `src/features/navigation/types.ts` defining the nav item/group shape (label,
  href, icon, grouping).
- [x] 3.2 Create `src/features/navigation/client.tsx` exporting a hook returning the current nav
  config, seeded with exactly one placeholder entry; verify by importing it in a scratch component
  and confirming it returns the expected shape.

## 4. App shell UI (`components/`)

- [x] 4.1 Create `src/features/navigation/components/app-sidebar.tsx` (not `components/` — it
  calls the `features/navigation` hook directly, which Biome's `noRestrictedImports` rule forbids
  from `components/`) using a single `Sidebar collapsible="icon"` (see `design.md` decision 2 for
  why the nested `sidebar-09` shape was dropped); verify the placeholder entry renders and is
  marked active when its route matches the current path.
- [x] 4.2 Wire `SidebarProvider` + `AppSidebar` + `SidebarInset` + `SidebarTrigger` into
  `src/app/(app)/layout.tsx`; verify the trigger and the `Ctrl/Cmd+B` shortcut both collapse and
  expand the sidebar. Verified live in browser: both the trigger click and `Ctrl+B` toggle collapse
  state; also fixed a polish bug found during verification where the "Slotly" header text
  truncated to "Slo…" instead of hiding cleanly when collapsed (added
  `group-data-[collapsible=icon]:hidden` to the header label span).
- [x] 4.3 Verify responsive behavior in a browser at a small viewport width: the sidebar is hidden
  by default and opens as an overlay/drawer rather than permanently shrinking the content area.
  **Verified by code inspection only, not live pixel resize**: the browser-automation tool's
  `resize_window` had no effect on this machine's (maximized) Chrome window (confirmed via
  `window.innerWidth` staying unchanged after the call), and `window.resizeTo()` is blocked by
  Chrome for non-script-opened tabs. The mobile branch itself is shadcn's own unmodified
  `sidebar.tsx` logic (`isMobile` → renders inside a `Sheet` drawer instead of the fixed panel,
  driven by `useIsMobile()`'s `matchMedia` check) — not code this change wrote — so this is a
  tooling limitation in verifying it live, not an unverified implementation.

## 5. Account menu (`features/auth`)

- [x] 5.1 Create `src/features/auth/components/nav-user.tsx` reading `authClient.useSession()` and
  rendering the avatar/name/email plus a sign-out action calling `authClient.signOut()`; verify
  opening the menu shows the currently signed-in host's real name/email. Verified live in browser
  (real signed-in host's name/email shown). Fixed a real bug found during verification: Base UI's
  `Menu.GroupLabel` (used by `DropdownMenuLabel`) throws if not wrapped in `Menu.Group`, unlike
  Radix — wrapped the user-info label in `DropdownMenuGroup`.
- [x] 5.2 Verify signing out ends the session and redirects to `/login`, and that a subsequent
  direct request to a shell route redirects to `/login` again (session guard from task 2.1 still
  holds). Verified live: clicking "Log out" redirected to `/login`, and a direct request to
  `/home` right after redirected to `/login` again. (Also confirmed independently via
  `curl -w "%{http_code} %{redirect_url}"` with no cookies: 307 → `/login`.)

## 6. Placeholder home + end-to-end check

- [x] 6.1 Create `src/app/(app)/home/page.tsx` as the placeholder content the single nav entry
  points to (`/home`, not bare `/` — that path is already the marketing placeholder at
  `src/app/page.tsx`; `(auth)/login` and `(auth)/signup` already redirect to `/` when already
  authenticated, updated to `/home` alongside this); verify it renders inside the shell (sidebar +
  content area both visible).
- [x] 6.2 Walk the full flow in a browser: log in → shell renders with sidebar, active nav entry,
  and account menu → collapse sidebar, reload, confirm it stays collapsed → open account menu and
  sign out → confirm redirect to `/login` → request a shell URL directly while logged out and
  confirm redirect to `/login`. Then run `bun run lint` and `bun run build` and confirm both pass.
  All steps verified live (see tasks 2–5 notes); `bun run lint` and `bun run build` both pass.
