# Architecture

## Folder structure

```
src/
  app/                       Routes only: pages, layouts, route handlers. Thin; they compose features.
    page.tsx                 Welcome page (public, static)
    (auth)/                  Sign in, sign up, forgot and reset password (split layout with artwork)
    auth/callback, confirm   Email link handlers (PKCE code, token hash)
    onboarding/              First-run flow
    (app)/                   Signed-in screens inside the app shell (sidebar / tab bar)
      today, discover, community, space, journal, control, settings
    (focus)/                 Full-screen flows without navigation: check-in, writing
    (legal)/                 Privacy, terms, help (public)
    admin/                   Admin area (own layout, admins only)
    manifest.ts, icon.svg, favicon.ico, apple-icon.png
  features/<feature>/        Everything for one feature, side by side
    actions.ts               Server Actions ("use server"): validate, authorise, write, revalidate
    queries.ts               Server-only reads ("server-only")
    schemas.ts               Zod schemas shared by client forms and server actions
    constants.ts             Words and options (labels, scales)
    components/ or *.tsx     The feature's UI
  components/
    ui/                      Design-system primitives: Button, Field, Input, Dialog, Chips, Skeleton...
    brand/                   Mark, wordmark, landscape artwork
    shell/                   App shell, navigation, page container and header
  lib/                       Cross-cutting: Supabase clients, session (data access layer), dates,
                             routes, results, toasts, hooks
supabase/
  migrations/                Schema, one file per change, applied in order
  seed.sql                   Sample content for development
  tests/database/            pgTAP tests for row level security and privacy
tests/e2e/                   Playwright tests and the screenshot run
docs/                        This documentation
scripts/                     Icon generation, admin grant
```

Rules of thumb:

- **Routes are thin.** A page reads the member, fetches in parallel, and renders feature components.
- **One feature, one folder.** To change journaling, open `src/features/journal`. Features may import
  other features' queries and components; they never import from `app/`.
- **Server first.** Pages and data-heavy components are Server Components. Client Components are
  the interactive leaves (forms, the check-in flow, toggles).

## Data flow

```
Browser ──(Server Action)──▶ features/x/actions.ts ──▶ Supabase (RLS) ──▶ revalidatePath ──▶ fresh UI
Browser ◀──(RSC stream)──── app/.../page.tsx ◀── features/x/queries.ts ◀── Supabase (RLS)
```

- **Reads** happen in Server Components through `features/*/queries.ts`, using the request-bound
  Supabase client (`lib/supabase/server.ts`). Row level security scopes every query to the member,
  so queries never filter by user id for security; Postgres does.
- **Writes** go through Server Actions. Each one: validates with the feature's Zod schema, calls
  `requireMember()` (or `requireAdmin()`), writes, then `revalidatePath` so every screen showing
  that data refreshes. Actions return `ActionResult` (`lib/result.ts`) and never throw for expected
  failures; the client shows the message as a toast and puts field errors on the form.
- **Optimistic UI** (`useOptimistic`) for small, frequent changes: ticking a step, sorting a thought,
  adding a step. Trackers update instantly and save once tapping stops.

## Authentication and the data access layer

- Supabase Auth with email and password, via `@supabase/ssr` cookies.
- `src/proxy.ts` (Next 16's middleware) refreshes the session on every request and makes the
  optimistic routing decision: visitors are sent to sign in with a `next` path, signed-in members
  skip the welcome and auth pages. It is not the security boundary.
- `lib/auth/session.ts` is the data access layer: `getSessionUser`, `getProfile`, `requireUser`,
  `requireMember` (also sends unfinished members to onboarding and computes their local `today`),
  and `requireAdmin` (404 for everyone else). All are memoised per request with React `cache`.
- The real boundary is Postgres row level security, tested in `supabase/tests/database`.
- Sign-out and account deletion end with a full page load, so pages Next.js keeps alive for
  instant back-navigation can never carry one member's data into another session on a shared device.

## Rendering, caching and speed

Next.js 16 with **Cache Components** and **Partial Prefetching**:

- Every page renders a **static shell** (layout, headings, navigation) instantly; member data streams
  into `<Suspense>` boundaries whose skeletons match the final layout, so nothing shifts.
- **Member data is never cached on the server.** `createClient()` calls `connection()`, so personal
  data is always read at request time and never stored in a shared cache.
- **Public content** (quotes, prompts, topics, videos) is read with a cookie-less client inside
  `"use cache"` functions (`features/content/queries.ts`), cached for a few minutes and tagged `content`.
  Admin changes call `updateTag("content")`, so members see them immediately.
- Next.js keeps recently visited pages alive (React Activity) so going back is instant. One-off flows
  reset when shown again with `useOnReveal` (`lib/use-on-reveal.ts`).

## Time and "today"

A member's day is their own calendar day in the timezone saved on their profile (captured from the
browser at sign-up and onboarding). `requireMember()` returns `today` as `YYYY-MM-DD`, and every
"today" query uses it (`lib/dates.ts`). Dates travel as ISO strings and are formatted at noon UTC so
they never shift by a day.

## Conventions

- TypeScript strict; database types generated into `src/lib/supabase/database.types.ts` (`pnpm db:types`).
- Import paths from `lib/routes.ts` rather than typing URLs.
- Every user-facing string is plain, kind and specific. Errors say what happened and what to do.
- Every block has loading, empty and error states; every control has hover, focus, pressed and
  disabled states. See [DESIGN.md](DESIGN.md).
- Logs from the server use a `[feature] where` prefix and never include journal content.
