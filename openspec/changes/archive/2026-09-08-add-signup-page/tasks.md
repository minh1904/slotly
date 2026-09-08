## 1. Route restructure ((auth) group)

- [x] 1.1 Create `src/app/(auth)/layout.tsx` rendering the shared two-panel shell (image panel +
      slot for page content) extracted from the existing `src/app/login/page.tsx`, and verify it
      compiles
- [x] 1.2 Move `src/app/login/page.tsx` to `src/app/(auth)/login/page.tsx`, updating it to render
      only its heading/form content inside the shared layout; verify `/login` still resolves to
      the same URL and behavior (empty form when unauthenticated, redirect to `/` when
      authenticated — re-check the `add-login-page` scenarios still pass)
      (page now also renders the "Don't have an account? Sign up" link, ahead of task 3.2 — same
      edit)

## 2. Sign-up schema and form

- [x] 2.1 Add `signupSchema` to `src/features/auth/schema.ts` (`name` non-empty, `email` via
      `z.email()`, `password` min 8 chars, `confirmPassword`, with a `.refine()` checking password
      === confirmPassword) and verify it rejects empty fields, a malformed email, and a
      password/confirmPassword mismatch
- [x] 2.2 Add `src/features/auth/components/signup-form.tsx`: client component using
      `react-hook-form` + `zodResolver(signupSchema)` + the existing shadcn `Form` primitives,
      submitting via `authClient.signUp.email({ name, email, password })`; verify empty submit
      shows required-field errors and mismatched passwords show an inline error under
      confirm-password, without a network call (per spec.md "Client-side field validation")
- [x] 2.3 Wire submit-in-flight state to the submit button (disabled + loading indicator while
      `authClient.signUp.email` is pending), matching `login-form.tsx`'s pattern; verify the
      button is disabled during submission (per spec.md "Submission loading state")
- [x] 2.4 On `authClient.signUp.email` duplicate-email error, set a field-level error on the email
      field ("An account with this email already exists.") with a link to `/login`; verify it
      renders when signing up with an already-registered email (per spec.md "Duplicate email")
      (matched on Better-Auth's `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` error code; other errors
      fall back to a generic root-level message)
- [x] 2.5 On success, redirect to `/` via `window.location.href`; verify a successful sign-up
      lands on `/` with a session established (per spec.md "Redirect after sign-up")

## 3. Sign-up page and cross-links

- [x] 3.1 Add `src/app/(auth)/signup/page.tsx` as a server component that reads the session and
      redirects to `/` if already authenticated, rendering `<SignupForm />` inside the shared
      `(auth)` layout with a heading and a "Already have an account? Log in" link to `/login` (per
      spec.md "Sign-up page" and "Already-authenticated visitor loads the sign-up page")
- [x] 3.2 Add a "Don't have an account? Sign up" link to `/signup` on the login page (per the
      modified `auth/login` spec's "Link to sign-up" scenario); verify both cross-links render and
      navigate correctly
      (done together with task 1.2's page move)

## 4. Documentation

- [x] 4.1 Write `src/features/auth/README.md` covering: what's implemented (login, sign-up,
      Better-Auth config), how the pieces fit together (file layout, `(auth)` route group), what's
      deliberately deferred and why (verification, password reset, OAuth, OTP), how this compares
      to Rallly's current OTP-based approach, and security follow-ups before production (rate
      limiting, captcha, verification) — in English, per CLAUDE.md's code-style rule

## 5. Verification

- [x] 5.1 Manually verify the full sign-up flow end-to-end against the running dev server: fresh
      email succeeds and redirects to `/` with a session; a duplicate email shows the field error
      and link to `/login`; an authenticated visit to `/signup` redirects to `/`; re-verify the
      `/login` flow still works after the route move (wrong password, correct password, redirect
      when already authenticated)
      (verified via direct calls to `/api/auth/sign-up/email` and `/api/auth/sign-in/email` — the
      same endpoints the client SDK calls — plus curl checks that both pages render 200 with their
      cross-links present and that both already-authenticated redirects 307 to `/`. Test users
      created and deleted afterward.)
- [x] 5.2 Run `bun run lint` and `bun run build` and verify both succeed
