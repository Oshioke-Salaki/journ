# Operations

## Content (no code needed)

Everything members read is managed in the admin area at `/admin`:

- **Videos:** upload the file to Mux, copy its playback ID, then add or edit the video in admin and
  switch it live. A video can go live before its file exists; members see "being recorded".
- **Quotes:** one live quote is shown each day, in rotation, to everyone. Check wording and author
  against the original source before publishing.
- **Prompts:** daily prompts (no topic) rotate on Today; topic prompts appear on each Community topic.
- **Topics:** names and introductions, and the 18+ flag.

Switching something off hides it from members without deleting it.

## Admins

- Local: `pnpm admin:grant someone@example.com`.
- Production: in the Supabase SQL editor,
  ```sql
  update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'someone@example.com');
  ```
  Set `role = 'member'` to remove access.

## Premium

Until payments are added, a member can be given premium in the SQL editor:
`update public.profiles set plan = 'premium' where id = (select id from auth.users where email = '…');`

## Backups and recovery

- Supabase Pro takes daily backups, kept for 7 days (restore from the dashboard).
- Schema is in git (`supabase/migrations`); content can be recreated from admin or `seed.sql`.

## Members asking about their data

- Export and deletion are self-service in Settings.
- For a request by email, verify the sender owns the account before acting. Delete an account from
  Supabase → Authentication → Users (this cascades to all their rows; remove their files in Storage
  → `vision/<user id>`).

## Monitoring

- Vercel → Logs for server errors. Server logs are prefixed `[feature] where` and never contain
  journal text.
- Supabase → Reports for database load and auth activity.
- Error alerts (Sentry) and analytics (PostHog) are planned; see [ROADMAP.md](ROADMAP.md).
