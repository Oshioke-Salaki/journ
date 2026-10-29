# JournApp

A daily journal for self-awareness: _notice what you can control, and move towards your goals one
small step at a time._

JournApp is a Progressive Web App (installable on iPhone, Android and desktop) built with Next.js 16
and Supabase. Native iOS and Android apps are planned and will share the same backend.

## What members can do

| Area | Features |
| --- | --- |
| **Welcome** | Public page with a live mini check-in, intro video, sign up and sign in |
| **Onboarding** | Name, optional birth date, time and place, country, language, pronouns; consent for prompts and reminders |
| **Today** | Greeting with the day's fact, one-tap check-in, the daily quote, the daily prompt, goal prompts (opt-in), habit trackers, circle of control |
| **Check-in** | Mood, body map ("where in my body"), energy, efficiency, self-satisfaction, feeling words, a note; one per day, editable |
| **Journal** | Free and prompted writing, drafts kept on the device, search, edit, delete |
| **Circle of control** | Sort thoughts into control, influence and outside; turn controllable ones into goal steps |
| **Discover** | Video library filtered by topic, free and premium |
| **Community** | Six topics (Nutrition, Breathing, Women's health, Movement, Sexuality 18+, Coaching) with videos and prompts |
| **My Space** | Reports (14-day landscapes, mood chart, body and feeling patterns, habit averages), goals with steps, plans, vision board |
| **Settings** | Profile, prompts and reminders, light or dark theme, download all data, delete account, sign out |
| **Support** | Public "Get support now" page, linked from low-mood check-ins |
| **Admin** | Videos, quotes, prompts and topics; totals-only overview (admins cannot read members' entries) |

See [docs/FEATURES.md](docs/FEATURES.md) for every screen and its states.

## Quick start

Requirements: Node 22+, pnpm 10, Docker (for the local Supabase stack).

```bash
pnpm install
pnpm db:start                 # local Supabase on ports 554xx; applies migrations and seed content
cp .env.example .env.local    # then paste the publishable key printed by db:start
pnpm dev                      # http://localhost:3000
```

Make yourself an admin after signing up: `pnpm admin:grant you@example.com`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` / `build` / `start` | Next.js development server, production build, production server |
| `pnpm typecheck` | Route types plus `tsc` |
| `pnpm lint` / `format` | ESLint / Prettier |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | End-to-end tests (Playwright) on desktop, iPhone and iPad sizes; needs `pnpm db:start` and `pnpm build` |
| `pnpm test:e2e -g "every screen"` | Screenshots of every screen, light and dark, into `screenshots/` (git-ignored) |
| `pnpm db:test` | Database tests (pgTAP): row level security, privacy, admin rules |
| `pnpm db:reset` / `db:types` | Rebuild the local database / regenerate TypeScript types from it |
| `pnpm admin:grant <email>` | Make a local member an admin |
| `pnpm icons` | Regenerate favicon, Apple and PWA icons from `public/icons/mark.svg` |

## Documentation

| Document | Read it for |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Folder structure, data flow, caching, auth, conventions |
| [Design](docs/DESIGN.md) | Brand, tokens, type, components, motion, states, accessibility |
| [Database](docs/DATABASE.md) | Tables, policies, functions, migrations |
| [Features](docs/FEATURES.md) | Every screen, from the client's sketches |
| [Testing](docs/TESTING.md) | Test layers and how to run them |
| [Deployment](docs/DEPLOYMENT.md) | Going live on Supabase and Vercel, and when to upgrade plans |
| [Operations](docs/OPERATIONS.md) | Managing content and admins, backups, incidents |
| [Security and privacy](docs/SECURITY.md) | How member data is protected |
| [Roadmap](docs/ROADMAP.md) | What comes next |

## Tech

Next.js 16 (App Router, Cache Components, Partial Prefetching) · React 19 · TypeScript · Tailwind CSS 4 ·
Supabase (Postgres, Auth, Storage, row level security) · Radix UI · Motion · Sonner · React Hook Form + Zod ·
Playwright · Vitest · pgTAP.
