## Context

See proposal.md - Why. Relevant current state:

- `auth/login` is shipped: `src/app/login/page.tsx` (server component, redirects if already
  authenticated), `src/features/auth/components/login-form.tsx` (client, `authClient.signIn.email`,
  react-hook-form + zod + shadcn `Form`), `src/features/auth/schema.ts` (`loginSchema`).
- `src/lib/auth.ts` has only `emailAndPassword.enabled: true` — no OTP, no OAuth, no
  `requireEmailVerification`. Confirmed with the user to keep it that way for this change.
- `User.name` is a required `String` in `prisma/schema.prisma` (Better-Auth's generated model) —
  sign-up must collect a name.
- Rallly's *current* registration is passwordless: `emailOTP({ disableSignUp: false })`,
  `requireEmailVerification: true`, `autoSignInAfterVerification: true`, one unified
  `login-email-form.tsx` that branches into an OTP-verify page, then a `/setup` onboarding step for
  brand-new accounts. This is a different shape than Slotly's plan (classic email+password, no
  verification, no onboarding step) — noted here so the divergence is a documented decision, not an
  oversight, and captured in the auth README for anyone comparing the two codebases.
- Rallly's `.claude/skills/create-auth-skill` (generic, not Rallly-specific) frames Better-Auth
  work as: scan project → ask scoped planning questions (methods, verification, pages, UI style) →
  summarize a plan → implement via a decision tree → reference tables (env vars, server/client
  config tiers, route handler, migrations, plugins) → security checklist. That planning shape is
  what drove the two AskUserQuestion rounds already answered (no email verification; no
  forgot-password in this change) — recorded here, not re-litigated.

## Goals / Non-Goals

**Goals:**
- Ship a working `/signup` page against the existing `emailAndPassword` Better-Auth config, no new
  dependencies.
- Make login ↔ signup feel like one flow: shared layout, cross-links, matching visual style.
- Document the auth feature (`src/features/auth/README.md`) well enough that a newcomer
  understands what's implemented, what's deliberately deferred, and why it differs from Rallly's
  current approach.

**Non-Goals:**
- Email verification, password reset, OAuth, email-OTP passwordless auth — all deferred (need
  Resend, none installed).
- A `/setup` onboarding step post-registration (Rallly's pattern) — Slotly has no
  space/organization concept yet for it to configure; out of scope until that exists.
- A password-strength meter — plain min-length validation is enough for MVP.
- Rate limiting / captcha on sign-up — a security hardening concern independent of shipping the
  page (same reasoning `add-login-page` used for login).

## Decisions

**Auth pattern: classic `authClient.signUp.email({ name, email, password })`, not Rallly's
current OTP flow.**
Matches what's already shipped for login and what the user explicitly chose (no verification, no
new email-provider dependency). Rallly's OTP approach is architecturally heavier (OTP page, cookie
handshake, Resend template) and solves a problem (email verification) Slotly isn't taking on yet.
Revisit if/when Slotly adds Resend.

**Route restructure: introduce `(auth)` route group now.**
`add-login-page`'s design.md deferred this "until a second auth page exists" — that's now.
`src/app/login/page.tsx` moves to `src/app/(auth)/login/page.tsx`, new
`src/app/(auth)/signup/page.tsx`, shared `src/app/(auth)/layout.tsx` rendering the two-panel
shell (image panel + slot for the page's own heading/form). URLs are unchanged since route groups
don't appear in the URL. `login-form.tsx`/`signup-form.tsx` stay in `features/auth/components/` —
only the panel chrome moves into the shared layout, not the forms themselves.

**Sign-up schema: `signupSchema` in the existing `features/auth/schema.ts`.**
`{ name: z.string().min(1), email: z.email(), password: z.string().min(8), confirmPassword:
z.string() }.refine(...)` for the password-match check. Kept alongside `loginSchema` rather than a
new file — one small schema file per CLAUDE.md's file-naming convention (`schema.ts`, not
`schemas/`).

**Duplicate-email error: specific, not generic.**
Unlike login's deliberately generic "invalid email or password" (don't leak whether an account
exists), sign-up's duplicate-email case is the visitor's own attempt to register — telling them
"this email is already registered" is standard, expected UX (and is what Better-Auth's
`USER_ALREADY_EXISTS`-shaped error already communicates), not an enumeration leak. Surface it as a
field-level error on the email input, with a "log in instead" link alongside it.

**Post-signup: immediate session + redirect to `/`, symmetric with login.**
No verification gate means `authClient.signUp.email` establishes a session the same way
`signIn.email` does. No `/setup`-style onboarding step (see Non-Goals).

**`src/features/auth/README.md` structure**, loosely modeled on the shape of Rallly's
`create-auth-skill`/best-practice skill docs (planning context → how it's wired → what's deferred
→ security follow-ups), but written as prose documentation of *this* codebase, not a generic
skill:
1. What's implemented (login, sign-up; Better-Auth config in `src/lib/auth.ts`)
2. How the pieces fit (`data`/`client`/`components`/`schema` files, the `(auth)` route group)
3. Deliberately deferred (verification, password reset, OAuth, OTP) and why
4. How this compares to Rallly's current (OTP-based) approach, for anyone cross-referencing
5. Security follow-ups before this goes to production (rate limiting, captcha, verification)

## Risks / Trade-offs

- [Moving `login/page.tsx` into a route group touches a file from the already-shipped
  `add-login-page` change] → Low risk: pure file move, no logic change, URL unchanged; verified by
  re-running the login flow checks from `add-login-page` after the move.
- [No email verification means anyone can register with an email they don't own] → Accepted
  trade-off for MVP, consistent with the user's explicit choice; flagged in the README's security
  follow-ups section so it isn't forgotten.
- [Plain min-length password validation, no strength meter] → Low risk for MVP; Rallly's
  `calculatePasswordStrength` is available as a reference if this needs to be stricter later.

## Open Questions

None — the two decisions that would have changed scope (email verification, forgot-password) were
already resolved with the user before writing this design.
