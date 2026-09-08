## Why

`auth/login` (shipped) only lets an already-registered user sign in — there is no way for a new
user to create an account, so the login page is currently a dead end. This change adds the
sign-up half of the auth flow and completes the "full đăng ký/đăng nhập" experience, referencing
how Rallly (the closest reference repo, same stack) approaches Better-Auth registration and its
own `create-auth-skill` planning process for scoping auth work.

Rallly's *current* registration flow is passwordless (email-OTP, `emailOTP({ disableSignUp: false
})`, `requireEmailVerification: true`) with a Resend-backed verification email — a materially
different, heavier pattern than Slotly's existing `emailAndPassword`-only setup. Slotly has no
email provider installed yet, so this change intentionally does **not** copy that pattern: it adds
a classic email+password sign-up (matching Slotly's already-shipped login), with no email
verification for now. This was confirmed with the user during planning; OTP/passwordless signup
matching Rallly's current approach is a possible later change once Resend is added.

## What Changes

- Add a `/signup` route with a form: full name, email, password, confirm password.
- Add a client-side sign-up form under `features/auth/components/`, submitting directly via
  `authClient.signUp.email(...)` (Better-Auth's client SDK) — same no-server-action-in-submit-path
  pattern as the existing login form.
- On successful sign-up, Better-Auth establishes a session immediately (no email verification
  gate), and the user is redirected to the home route — symmetric with the login flow.
- Duplicate-email sign-up attempts get a specific, inline field-level error on the email field
  (distinct from login's deliberately-generic error — telling a user who just tried to register
  that the email is already taken is normal signup UX, not an account-enumeration leak).
- Cross-link the two auth pages: login page gets a "Don't have an account? Sign up" link, sign-up
  page gets a "Already have an account? Log in" link (**MODIFIED**: `auth/login`'s "Login page"
  requirement gains a scenario for this link).
- Introduce a shared `(auth)` route group with a common layout, now that there are two auth pages
  — reverses `add-login-page`'s design.md decision to defer this until a second auth page existed.
  `/login` and `/signup` URLs are unchanged (route groups don't affect the URL).
- Add `src/features/auth/README.md`: an onboarding doc explaining Slotly's Better-Auth setup, the
  login + sign-up flows, and why they differ from Rallly's current (OTP-based) approach — modeled
  on the structure of Rallly's `create-auth-skill`/best-practice skill docs (planning context →
  how it's wired up → security follow-ups), written for a developer new to this codebase.

Out of scope for this change (deferred, same reasoning as `add-login-page`): email verification,
forgot/reset password, OAuth/social login, email-OTP passwordless auth, password strength meter,
rate limiting/captcha on sign-up.

## Capabilities

### New Capabilities
- `auth/signup`: the sign-up page and form — rendering the shared two-panel auth layout,
  collecting name/email/password, validating input, submitting to Better-Auth, handling
  success/duplicate-email/error states.

### Modified Capabilities
- `auth/login`: "Login page" requirement gains a scenario — the page SHALL link to `/signup`.

## Impact

- New route: `src/app/(auth)/signup/page.tsx`.
- Moved route (URL unchanged): `src/app/login/page.tsx` → `src/app/(auth)/login/page.tsx`, plus a
  new `src/app/(auth)/layout.tsx` shared by both.
- New feature UI: `src/features/auth/components/signup-form.tsx` (client component).
- `src/features/auth/schema.ts`: add a `signupSchema` (name, email, password, confirm password)
  alongside the existing `loginSchema`.
- New doc: `src/features/auth/README.md`.
- No new shadcn components needed — reuses `button`/`input`/`label`/`form` from `add-login-page`.
- No new dependencies (no Resend, no email-OTP plugin) — reuses Better-Auth's already-enabled
  `emailAndPassword` provider as-is.
- No schema/migration changes — `User.name`/`email`/password credential already exist via
  Better-Auth's generated Prisma models.
