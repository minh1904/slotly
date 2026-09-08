# Auth

Login and sign-up, built on [Better-Auth](https://better-auth.com) with its email/password
provider. This doc is an onboarding map of what's implemented, how the pieces fit, what's
deliberately deferred, and how this compares to [Rallly](https://github.com/lukevella/rallly)'s
current approach — Slotly's closest reference repo for this stack.

## What's implemented

- **Login** (`/login`) — email + password. `src/app/(auth)/login/page.tsx` +
  `components/login-form.tsx`.
- **Sign-up** (`/signup`) — name + email + password + confirm password. `POST`s straight to
  Better-Auth, no email verification gate. `src/app/(auth)/signup/page.tsx` +
  `components/signup-form.tsx`.
- Both forms submit **client-side**, straight to Better-Auth's client SDK
  (`authClient.signIn.email` / `authClient.signUp.email`) — no Server Action in the submit path.
  Better-Auth's client already performs the fetch and sets the session cookie; a Server Action
  would just add a hop.
- Server config lives in `src/lib/auth.ts` (`betterAuth({ emailAndPassword: { enabled: true } })`,
  Prisma adapter over Neon Postgres). Client config is `src/features/auth/client.tsx`
  (`createAuthClient()`, no plugins).

## How the pieces fit

```
src/app/(auth)/
  layout.tsx          shared two-panel shell (form panel + image panel)
  login/page.tsx       server component: redirects away if already authenticated
  signup/page.tsx       "

src/features/auth/
  client.tsx           Better-Auth React client (authClient)
  schema.ts             zod schemas: loginSchema, signupSchema
  components/
    login-form.tsx      client component: react-hook-form + zod + shadcn Form
    signup-form.tsx       "
```

The `(auth)` route group exists purely to share layout — it doesn't change either URL (`/login`,
`/signup`). Each page component only renders its own heading, form, and cross-link; the two-panel
chrome (image panel, centering, max-width) lives once in `(auth)/layout.tsx`.

Error handling differs by page on purpose:

- **Login** always shows a single generic "Invalid email or password" — it must not reveal
  whether an email is registered.
- **Sign-up** shows a specific "an account with this email already exists" error on the email
  field, with a link to log in — telling someone who just tried to register that the email is
  taken is normal UX, not an account-enumeration leak.

## Deliberately deferred

None of these are enabled today. Each needs infrastructure Slotly doesn't have yet (an email
provider) or is a separate concern from shipping the base flow:

| Feature | Why deferred |
|---|---|
| Email verification | Needs an email provider (Resend, per `CLAUDE.md`) — not installed yet. |
| Forgot / reset password | Same — needs an email provider to deliver the reset link. |
| OAuth / social login | Not requested yet; `emailAndPassword` covers the MVP. |
| Email-OTP passwordless login | See "vs. Rallly" below — a heavier pattern, not needed yet. |
| Password-strength meter | Plain `min(8)` validation is enough for MVP. |
| Rate limiting / captcha on sign-up | Security hardening, independent of shipping the page. |

## vs. Rallly's current approach

Rallly's registration flow has moved to **passwordless email-OTP**
(`emailOTP({ disableSignUp: false })`, `requireEmailVerification: true`,
`autoSignInAfterVerification: true`): one form collects just an email, sends a 6-digit code
(Resend-backed), and verifying the code both creates the account and signs the user in. Brand-new
accounts are then routed through a `/setup` onboarding step to collect a name, timezone, and
workspace details.

Slotly intentionally does **not** copy that pattern:

- No email provider is installed yet, so an OTP flow isn't buildable without first adding one.
- Slotly has no workspace/organization concept yet for a `/setup` step to configure.
- A classic `name` + `email` + `password` form, with an immediate session on success, is simpler
  and matches what's already shipped for login.

If Slotly later adds Resend and a workspace concept, the OTP-based approach becomes worth
revisiting — Rallly's `login-email-form.tsx` / `otp-form.tsx` / `login/verify/page.tsx` are the
reference implementation.

## Security follow-ups before production

- [ ] Enable email verification once an email provider exists (`emailAndPassword
  .requireEmailVerification`).
- [ ] Add rate limiting on `/api/auth/sign-in/email` and `/api/auth/sign-up/email`.
- [ ] Add a captcha (e.g. Cloudflare Turnstile, as Rallly does) on sign-up to deter automated
  registration.
- [ ] Revisit the plain password-length check — a strength meter or breach check
  (`haveibeenpwned` plugin) if account security needs to be stricter.
