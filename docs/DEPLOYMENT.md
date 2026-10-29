# Deployment

JournApp runs on **Vercel** (the app) and **Supabase** (database, auth, storage). Create every account
in JournApp's name and billing, and invite developers to it.

## 1. Supabase project

1. Create a project at supabase.com. Choose the region closest to most members (for Kenya and
   Europe, `eu-west` or `eu-central`).
2. Link and push the schema from this repository:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
3. Content: run `supabase/seed.sql` in the SQL editor for the sample content, or start empty and
   add content in the admin area.
4. **Auth settings** (site URL, redirect URLs, password rules, email confirmation, rate limits) are
   pushed from code, not clicked in the dashboard. Needs Owner or Admin on the organisation:
   ```bash
   SITE_URL=https://<your-domain> bash scripts/push-auth-config.sh                       # preview: no confirmation emails
   SITE_URL=https://<your-domain> CONFIRM_EMAIL=true bash scripts/push-auth-config.sh    # once SMTP is connected
   ```
   It shows the exact diff and asks before pushing.
5. Email confirmation stays **off** until SMTP is connected (step 7): Supabase's built-in email only
   reaches the project team, so members could not confirm their accounts.
6. **Email templates:** so links also work when opened on another device, point them at the
   token-hash route, for example for "Confirm signup":
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`
   and for "Reset password":
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
7. **SMTP:** Supabase's built-in email is for testing only (a few emails per hour). Connect Resend
   (Project Settings → Authentication → SMTP) before inviting members.
8. Make the first admin, in the SQL editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'someone@journapp.com');
   ```

## 2. Vercel

1. Import the repository. Framework: Next.js. Install command `pnpm install`, build `pnpm build`.
2. Environment variables (Production and Preview):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The publishable key (`sb_publishable_…`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` |

   No secret keys are needed: the app only ever acts as the signed-in member.
3. Add the domain (and point DNS at Vercel). The client already owns a domain; it can be transferred
   or simply pointed at Vercel with DNS records.

## 3. Before opening to the public

- [ ] Supabase on **Pro** (daily backups; the free plan has none and pauses after a week idle).
- [ ] Vercel on **Pro** (the free plan is for non-commercial use only).
- [ ] Email confirmation on, SMTP connected, templates updated (step 1.6–1.7).
- [ ] Privacy policy and terms reviewed by a lawyer (drafts at `/privacy` and `/terms`).
- [ ] Real content in the admin area: quotes checked against their sources, prompts, topics, videos.
- [ ] Videos uploaded to Mux and their playback IDs added in admin.
- [ ] `pnpm check`, `pnpm db:test` and `pnpm test:e2e` all green on the release commit.

## When to upgrade

| Service | Free plan limit | Upgrade when |
| --- | --- | --- |
| Supabase | 500 MB database, 1 GB files, 50,000 monthly users, no backups, pauses after 7 days idle | Before real members (backups), or at any limit |
| Vercel | Non-commercial use | At public launch |
| Mux | 10 stored videos | The 11th video |
| Resend | 100 emails a day | More than about 100 daily reminder emails |

## Current deployment

| | |
| --- | --- |
| App | https://journ-lyart.vercel.app (Vercel project `journ`, team `oshiokesalakis-projects`, deploys on every push to `main`) |
| Database | Supabase project `journal` (`xfdjqoxubbjxzxibtfvu`), eu-west-2 London |
| Code | https://github.com/Oshioke-Salaki/journ |

## Local production check

```bash
pnpm db:start && pnpm build && pnpm start      # http://localhost:3000
```
