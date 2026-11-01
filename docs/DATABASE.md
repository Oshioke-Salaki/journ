# Database

Postgres on Supabase. The schema lives in `supabase/migrations` (applied in filename order) and is the
only way the schema changes: never edit a production database by hand.

## Tables

| Table | Holds | Owner |
| --- | --- | --- |
| `profiles` | One row per member: name, optional birth date, time and place (with latitude, longitude, timezone and country from the place search), country, language, pronouns, timezone, consent flags, reminder time, `checklist_dismissed_at`, `role` (member/admin), `plan` (free/premium) | Member (role and plan are not writable by members) |
| `check_ins` | One per member per local day: mood 1–5, energy, efficiency, self-satisfaction, body notes (JSON `[{area, sensation}]`), feeling words, note | Member |
| `tracker_entries` | Water, sleep, movement, nutrition, stillness, per day | Member |
| `journal_entries` | Free and prompted entries; a prompted entry keeps a copy of its prompt. `body_doc` holds the formatted document (sanitised ProseMirror JSON); `body` its plain text for search, previews and word counts; `tags` up to 10 lowercase tags (`valid_tags()`, GIN index) | Member |
| `goals`, `goal_steps` | Goals with status (active, paused, achieved) and ordered steps; dated steps are "My plans" | Member |
| `control_items` | Circle of control: thoughts sorted into control, influence, outside; may link to a goal step | Member |
| `vision_items` | Vision board: words, or a picture stored in the private `vision` bucket | Member |
| `saved_videos` | Videos saved to watch later (`user_id`, `video_id`) | Member |
| `feedback` | Messages to the team: kind (idea, problem, other), body, browser for problems, status (new, done) | Member writes; admins read and mark |
| `topics` | The six Community areas; `is_mature` gates 18+ content | Content |
| `prompts` | Journaling prompts, daily (no topic) or per topic | Content |
| `quotes` | Daily quotes, rotated by `quote_for_day(date)` | Content |
| `videos` | Lessons, practices and coaching sessions; `tier` free or premium; `mux_playback_id` once uploaded | Content |

Storage: bucket `vision` (private, 5 MB per file, JPEG/PNG/WebP). Files live under
`<user id>/<uuid>.webp`; the browser compresses pictures before upload.

## Row level security

Every table has RLS enabled.

- **Member tables:** select, insert, update and delete only where `user_id = auth.uid()`. A goal step
  must belong to a goal of the same member (trigger `goal_steps_check_owner`).
- **Profiles:** members read and update only their own row, and only these columns:
  display name, the optional details, timezone, consent flags, reminder time, onboarding and 18+
  confirmation. `role` and `plan` can only change from the service role or SQL.
- **Content:** anyone can read active or published content (it holds nothing private, which lets the
  app cache it); only admins (`is_admin()`) can write.
- **Storage:** members read, upload and delete only inside their own folder.
- **Two-step sign-in:** every member table, and the `vision` bucket, also has a restrictive policy
  `mfa_satisfied()`: a member who has set up an authenticator app reaches their rows only with an
  `aal2` session. Members without one are unaffected. `is_admin()` requires it too.
- **Feedback:** members insert their own (always `new`) and read their own; admins read all and may
  change only `status` (column grant).

## Functions

| Function | Purpose |
| --- | --- |
| `handle_new_user()` | Trigger on `auth.users`: creates the profile with the name and timezone from sign-up |
| `is_admin()` | True when the caller's profile role is admin and two-step sign-in is satisfied |
| `mfa_satisfied()` | True for an `aal2` session, or for a member with no verified authenticator |
| `valid_tags(text[])` | The check on journal tags: at most 10, each lowercase letters, numbers, spaces and hyphens |
| `quote_for_day(date)` | The day's quote, the same for everyone, rotating through active quotes |
| `export_my_data()` | Everything stored about the caller, as JSON ("Download my data") |
| `delete_my_account()` | Deletes the caller's auth user; every member table cascades (pictures are removed first by the app) |
| `admin_stats()` | Totals for the admin overview. Admins only. Never returns members' content |
| `admin_list_admins()`, `admin_set_role(email, make_admin)` | The admin team. Admins only; no one can remove themselves and the last admin stays |
| `admin_list_feedback(status)` | The inbox, with each sender's email and name. Admins only |
| `admin_reset_two_step(email)` | Removes a member's authenticator after they lost it. Admins only |

## Working with migrations

```bash
pnpm db:start                                # local stack
npx supabase migration new add_something     # new empty migration file
pnpm db:reset                                # rebuild locally from all migrations + seed
pnpm db:types                                # regenerate src/lib/supabase/database.types.ts
pnpm db:test                                 # pgTAP tests in supabase/tests/database
npx supabase db push                         # apply to the linked hosted project
```

Every new table needs: RLS enabled, policies, an index on `user_id` (and the columns it is queried by),
a test in `supabase/tests/database`, and an entry in `export_my_data()` if it holds member data.

## Seed content

`supabase/seed.sql` holds the topics, 24 prompts, 14 quotes and 13 sample videos used for the
preview. All of it is placeholder content for the JournApp team to replace through the admin area.
Only one quote is attributed (Epictetus, Enchiridion, Oldfather translation); the rest are original.
