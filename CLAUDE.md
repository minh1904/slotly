@AGENTS.md

# Slotly

A minimal booking scheduler, in the spirit of a stripped-down Calendly.

## Stack

- Next.js 16 App Router + TypeScript + React 19 + Tailwind v4, bun.
- API layer: **Server Actions only** (`"use server"`) — no tRPC. Route Handlers are only for the
  Google Calendar webhook. Matches where Rallly (closest reference repo) is already heading: its
  own tRPC is frozen to legacy reads, all new mutations go through Server Actions.
- DB: Postgres (Neon) + **Prisma**.
- Auth: **Better-Auth**.
- Recurring rules: `rrule.js`. Timezone: date-fns v4 + `@date-fns/tz`. Email: Resend.

Not installed yet.

## Architecture (`src/`)

Layering, imports only flow right, never left:

```
app → features → components → lib
```

- `app/` — routing only. Routes are thin adapters composing `features/*`, no logic.
- `features/<domain>/` — where the actual product lives. **A feature must own at least one of**:
  a distinct DB entity, an external integration (Google Calendar, Resend...), or server-lifecycle
  logic. UI alone doesn't qualify — it belongs in `components/`, or a `components/` folder inside
  another feature.
- `components/` — shared, domain-agnostic UI only. Never imports from `features/`.
- `lib/` — infra/cross-cutting (db client, auth config...). Never imports from `features/`/`components/`/`app/`.

Inside each feature, use only these file names (don't invent new ones):

| File | Role |
|---|---|
| `data.ts` | DB reads, explicit params, `server-only`, never reads session/request |
| `loaders.ts` | Auth-aware reads — resolves user from session, calls `data.ts` |
| `mutations.ts` | DB writes + cache invalidation, explicit params, never reads session |
| `actions.ts` | `"use server"` — the only place doing auth/authorization, calls `mutations.ts` |
| `service.ts` | Client for a third-party API (Google Calendar, Resend...) |
| `schema.ts` | Zod schema |
| `types.ts`, `constants.ts`, `utils.ts` | As named |
| `client.tsx` | Client entry — providers/context/hooks combined, no separate `hooks.ts` |
| `components/` | This feature's own UI |

`data.ts`/`mutations.ts` are the only files allowed to import the DB client directly.

Distilled from reading [Rallly](https://github.com/lukevella/rallly)'s `CLAUDE.md` (same stack,
closest domain) — kept only the foundational architecture needed before writing code; specific
correctness rules (timezone, caching...) get added as they're actually hit, not copied wholesale.

## Commit

[Conventional Commits](https://www.conventionalcommits.org/) — matches [Cal.diy](https://github.com/calcom/cal.diy)'s
real convention, no gitmoji:

```
<type>(<scope>): <short description, present tense>
```

- `type`: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`
- `scope`: feature name (`booking`, `availability`, `calendar-sync`...) — matches the folder name under `features/`
- Examples: `feat(booking): prevent double-booking via transaction`, `fix(availability): wrong time on DST`

## Code style

- All code, comments, commit messages, and docs: **English only**.
- Comments: short, one line, only when the *why* isn't obvious from the code. No multi-line
  comment blocks, no restating what the code already says.

## Commands

```
bun dev
bun run build
bun run lint
```
