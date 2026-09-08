## 1. UI primitives

- [x] 1.1 Run `bunx shadcn add button input label form` and verify
      `src/components/ui/{button,input,label,form}.tsx` and `components.json` are created, and
      `react-hook-form`/`@hookform/resolvers`/`zod` are present in `package.json`
      (form.tsx hand-adapted from shadcn's registry source to this project's base-nova style —
      the CLI's `add form` didn't ship files for this style; see chat for the RHF-vs-Base-UI
      decision the user confirmed)

## 2. Auth schema and form

- [x] 2.1 Add `src/features/auth/schema.ts` exporting a zod schema for `{ email, password }`
      (`z.email()`, non-empty password) and verify it rejects an empty object and an invalid email
- [x] 2.2 Add `src/features/auth/components/login-form.tsx`: client component using
      `react-hook-form` + `zodResolver(loginSchema)` + shadcn `Form`/`FormField`/`FormItem`/
      `FormLabel`/`FormControl`/`FormMessage`, submitting via `authClient.signIn.email({ email,
      password })` from `src/features/auth/client.tsx`; verify empty submit shows required-field
      errors and malformed email shows an inline error, without a network call (per spec.md
      "Client-side field validation")
- [x] 2.3 Wire submit-in-flight state to the submit button (disabled + loading indicator while
      `authClient.signIn.email` is pending) and verify the button is disabled during submission
      (per spec.md "Submission loading state")
- [x] 2.4 On `authClient.signIn.email` error, set a single generic "Invalid email or password"
      form-level error (no field-specific leak of which part was wrong) and verify it renders for
      both a wrong password and an unregistered email (per spec.md "Wrong password" / "Unregistered
      email" scenarios)
- [x] 2.5 On success, redirect to `/` via `window.location.href` (hard navigation, so the fresh
      session cookie is read) and verify a successful login lands on `/` (per spec.md "Redirect
      after login")

## 3. Login page

- [x] 3.1 Add `src/app/login/page.tsx` as a server component that reads the session
      (`auth.api.getSession`) and redirects to `/` if already authenticated, without rendering the
      form (per spec.md "Already-authenticated visitor loads the login page")
- [x] 3.2 Build the two-panel layout in `login/page.tsx` (image panel + form panel containing
      `<LoginForm />`), matching the Figma reference's panel proportions/placement; verify visually
      in the browser at `/login`
- [x] 3.3 Add a placeholder image asset for the image panel and verify it renders at `/login`
      without a broken-image state
      (used a gradient panel, not a static image file, per design.md's "or a solid-color panel if
      none exists yet" fallback — no brand asset exists yet)

## 4. Verification

- [x] 4.1 Manually verify the full login flow end-to-end against a real Better-Auth user
      (register one via existing `/api/auth/[...all]` sign-up endpoint or Prisma Studio if needed):
      wrong password shows the generic error, correct credentials redirect to `/`
      (verified against the running dev server: `/login` renders the empty two-panel form;
      wrong password and an unregistered email both return the same
      `INVALID_EMAIL_OR_PASSWORD` from Better-Auth, matching the form's single generic error
      message; correct credentials return 200 + session cookie; an authenticated request to
      `/login` 307-redirects to `/`. Verified via direct calls to the same
      `/api/auth/sign-in/email` endpoint the client SDK calls, plus one screenshot of the initial
      render, rather than full interactive browser click-through — the user asked to stop
      driving the browser mid-session. Test user created and deleted afterward.)
- [x] 4.2 Run `bun run lint` and `bun run build` and verify both succeed
      (added a `biome-ignore` on the shadcn-generated `Label` primitive's a11y rule — it's a
      generic wrapper, `htmlFor` is supplied by callers like `FormLabel`)
