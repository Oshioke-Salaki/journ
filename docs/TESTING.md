# Testing

Four layers, from fastest to most complete.

| Layer | Command | Covers |
| --- | --- | --- |
| Types and lint | `pnpm typecheck`, `pnpm lint` | Route types, TypeScript strict, React and Next.js rules |
| Unit | `pnpm test` | Dates and timezones, safe redirects, validation rules, landscape geometry, report maths, tracker formatting, auth messages (`tests/unit`) |
| Database | `pnpm db:test` | Row level security for every member table and storage, column grants (no self-promotion to admin or premium), the export, account deletion, admin-only stats (`supabase/tests/database`) |
| End to end | `pnpm test:e2e` | Every flow in a real browser against the local database, on a 1440×900 laptop, an iPhone 15 and an iPad (`tests/e2e`) |

`pnpm check` runs types, lint and unit tests together.

## End-to-end tests

Prerequisites: `pnpm db:start` and `pnpm build`. Playwright starts `next start` on port 3100 (it reuses
one already running). Every test signs up its own member, so tests run in parallel and never share
state.

| File | Flows |
| --- | --- |
| `auth.spec.ts` | Protected redirects with return path, sign-up validation, sign up → onboard → sign out → wrong password → sign in, duplicate email, signed-in members skip the welcome page, forgot password |
| `check-in.spec.ts` | One-tap start, body map, levels, words, save, Today summary, update, My Space chart; mood required |
| `journal.spec.ts` | Prompted entry, read, edit, delete; draft survives a reload; another member's entry is not found |
| `goals.spec.ts` | Set a goal with steps, tick, add, Today prompt, My plans, achieve, delete; validation |
| `content.spec.ts` | Discover filtering and video page, Community topics and the 18+ gate, the welcome page's live check-in |
| `features.spec.ts` | Trackers, circle of control to goal, vision board words and picture upload, journal search, public support page, admin access and content management |
| `settings.spec.ts` | Profile, preferences, theme, data export contents, account deletion (and sign-in refused afterwards) |
| `screens.spec.ts` | Screenshots of every screen in light and dark, plus axe accessibility checks (fails on serious or critical issues) |

## Against the live site

```bash
E2E_BASE_URL=https://journ-lyart.vercel.app pnpm test:e2e:live
bash scripts/remote-sql.sh "delete from auth.users where email like 'e2e-%@example.test'"   # clean up afterwards
```

Runs the same suite against the deployed app and the hosted database (raise the sign-up rate limit
first with `SIGNUP_RATE=300` in `scripts/push-auth-config.sh`, and set it back afterwards). Admin tests
grant admin to their own test account through `scripts/remote-sql.sh`; only `e2e-…@example.test`
accounts can be promoted this way.

## Screenshots

```bash
pnpm test:e2e -g "every screen"
```

writes full-page screenshots to `screenshots/desktop`, `screenshots/tablet` and `screenshots/mobile`
(git-ignored), named `light-…` and `dark-…` in the order a member meets the screens.

## Notes for writing tests

- Next.js keeps visited pages alive but hidden. Prefer `getByRole` (it ignores hidden content);
  add `.filter({ visible: true })` to `getByLabel` and `getByText`.
- Wait for a form's submit button to be enabled before typing: forms are inactive until the page has
  loaded its scripts.
- Use `scripts/grant-admin.sh` (via `grantAdmin()` in `tests/e2e/helpers.ts`) to test admin screens.
