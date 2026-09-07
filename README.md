# Slotly

Mini booking scheduler (a stripped-down Calendly) — host sets weekly availability, invitees book a
slot without double-booking, bookings sync one-way to Google Calendar, confirmation emails sent
automatically.

**Status:** 🚧 Building (Week 1/4) — full roadmap at
[`fullstack-portfolio/01-booking-scheduler`](https://github.com/minh1904/idea/tree/main/01-booking-scheduler).

Project 01 in a 3-project fullstack portfolio (booking/business-logic — the other two are a
creative WebGL SaaS and an AI RAG doc assistant).

## Stack

Next.js 16 (App Router) · TypeScript · React 19 · Tailwind v4 — no separate backend, uses Route
Handlers/Server Actions. See `CLAUDE.md` for architecture and conventions.

## Getting started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).
