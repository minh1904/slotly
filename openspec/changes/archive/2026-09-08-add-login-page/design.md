## Context

See proposal.md - Why. Relevant current state:

- Better-Auth server instance at `src/lib/auth.ts` has only `emailAndPassword.enabled: true` — no
  OAuth, no OTP.
- Better-Auth client instance at `src/features/auth/client.tsx` (`authClient`) has no plugins.
- Route handler already mounted at `src/app/api/auth/[...all]/route.ts`.
- No shadcn/ui components installed yet (`src/components/ui/` doesn't exist, no `components.json`).
- Reference: Rallly's login form (`apps/web/src/app/[locale]/(auth)/login/`) submits directly from
  a client component via `authClient.signIn.email(...)`, using `react-hook-form` + `zodResolver` +
  shadcn `Form`/`FormField`/... primitives, and maps specific Better-Auth error codes to
  `form.setError(...)`. No server action sits in the submit path — Better-Auth's client SDK
  already handles the request/cookie exchange itself.
- Figma reference (`Slotly` file, node `5:7`): a 1440×1024 two-panel frame — form content on one
  side (small top bar, heading, subtext, labeled inputs, primary button, helper text below it),
  a full-height image filling the other side. The specific content in that mockup is a contact
  form (placeholder content), not a login form — only the panel layout is being reused.

## Goals / Non-Goals

**Goals:**
- Ship a working `/login` page against the existing email/password Better-Auth config.
- Match the two-panel structure from the Figma reference at the layout level (proportions,
  panel split, position of heading/form/image) without treating the mockup's exact copy or
  contact-form fields as binding.
- Follow Rallly's proven pattern for the submit path (client-side `authClient` call, inline
  react-hook-form + zod errors) since it's the same auth library.

**Non-Goals:**
- Pixel-perfect match to the Figma mockup's specific visual details (exact colors/spacing/imagery)
  — the mockup shown was a stand-in "Get in touch" contact layout, not a finished login design.
- Sign-up, forgot/reset password, OAuth, or email-OTP — none are enabled in `src/lib/auth.ts`
  today; adding a login screen for methods that don't exist yet is out of scope.
- A `(auth)` route group with a shared layout for multiple auth pages — deferred until a second
  auth page (e.g. sign-up) actually exists, to avoid building structure for one page.

## Decisions

**Route location: `src/app/login/page.tsx`, not a route group.**
Rallly uses a `(auth)` route group because it has several auth pages (login, verify,
forgot-password, reset-password) sharing a layout. Slotly currently only ships one auth page.
Adding a `(auth)` group now would be structure for pages that don't exist. Revisit when a second
auth route is added.

**Submit path: client component calling `authClient.signIn.email()` directly, no server action.**
Matches Rallly. Better-Auth's client SDK already performs the fetch to the route handler and
handles the session cookie; wrapping it in a `"use server"` action would add a hop with no
benefit and would fight Better-Auth's documented client-side usage. This does mean the login
form's submit logic lives in a client component rather than `features/auth/actions.ts` — consistent
with how Slotly's own route handler (`src/app/api/auth/[...all]/route.ts`) already delegates
auth's request handling to Better-Auth rather than Server Actions, per CLAUDE.md's stack note that
Server Actions are the API layer for everything *except* what Better-Auth itself owns.

**Form stack: react-hook-form + zod + shadcn `Form` primitives.**
Matches Rallly (same problem, same libraries) and matches CLAUDE.md's shadcn-first policy for
UI primitives. `zod` is already a transitive dependency via Better-Auth; `react-hook-form` and
`@hookform/resolvers` are pulled in by the shadcn `form` component itself
(`bunx shadcn add form`), not added independently.

**File layout inside `features/auth/`:**
- `src/features/auth/schema.ts` — zod schema for `{ email, password }`.
- `src/features/auth/components/login-form.tsx` — client component: form state, calls
  `authClient.signIn.email`, maps errors, redirects on success.
- `src/app/login/page.tsx` — thin route file: renders the two-panel layout and
  `<LoginForm />`. Server component; checks the session server-side and redirects if already
  authenticated (mirrors Rallly's `AlreadyLoggedIn` handling, but as a redirect since Slotly has
  no other auth pages yet to link to).

**Image panel content:** use a static placeholder image (e.g. an existing brand/marketing asset,
or a solid-color panel if none exists yet) rather than blocking this change on final brand
photography — swapping the image later is a one-line change.

**Error mapping:** start with a single generic "Invalid email or password" message for both wrong-
password and unregistered-email cases (per spec.md, the system must not reveal which one it was).
Skip Rallly's broader error-code switch (`BANNED_USER`, `EMAIL_BLOCKED`, etc.) since those map to
account states Slotly doesn't have yet (no ban/block feature) — add them when those features exist.

## Risks / Trade-offs

- [Placeholder image panel ships instead of final design asset] → Low risk, isolated to one
  `src/app/login/page.tsx` JSX reference; swap when a real asset is ready.
- [No rate-limiting/lockout on repeated failed logins] → Better-Auth may provide this at the
  library level (not yet verified); if not, tracked as a follow-up rather than blocking this
  change, since brute-force protection is a security hardening concern independent of shipping the
  page.
- [Single generic error message may frustrate users who mistyped their email vs. never signed up]
  → Accepted trade-off per spec.md's requirement not to leak account existence; revisit only if
  product feedback says otherwise.

## Open Questions

- Final image/photo for the image panel — placeholder is fine for this change; swap when design
  provides one.
