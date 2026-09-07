# Slotly

A minimal booking scheduler. A host sets weekly availability, invitees book a slot without
double-booking, bookings sync one-way to Google Calendar, and confirmation emails are sent
automatically.

## Stack

Next.js 16 (App Router) · TypeScript · React 19 · Tailwind v4 · Prisma 8 ("Prisma Next", RC) +
Postgres (Neon) · Better-Auth · Resend — no separate backend framework, no tRPC: Server Actions
handle reads and writes directly. See `CLAUDE.md` for architecture and conventions.

## Getting started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).
