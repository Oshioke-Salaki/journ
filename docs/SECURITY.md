# Security and privacy

JournApp holds people's moods, bodies, sexuality and private writing. In the UK and EU this is
special category data under GDPR, and sensitive personal data under Kenya's Data Protection Act 2019.
Treat every change to data handling as a privacy change.

## How member data is protected

- **Row level security** on every table. A member can only ever read or change their own rows; this
  is enforced by Postgres, not by the app, and covered by `supabase/tests/database`.
- **Admins cannot read members' content.** The admin overview uses `admin_stats()`, which returns
  totals only. Admin rights do not bypass member policies.
- **Role and plan are not writable** by members (column-level grants).
- **No secret keys in the app.** The app talks to Supabase only with the publishable key and the
  member's own session; there is no service-role key to leak.
- **Private storage.** Vision board pictures sit in a private bucket under the member's folder and
  are shown through signed links that expire after an hour.
- **Never cached on the server.** Member data is read at request time and never stored in Next.js's
  shared cache. Only public content (quotes, prompts, topics, videos) is cached.
- **Shared devices.** Sign-out and account deletion do a full page load and clear journal drafts,
  so nothing of one member stays in the browser for the next.
- **Sessions** are refreshed by the proxy on every request and verified again in every page and
  action (`lib/auth/session.ts`). Redirects after sign-in accept only same-site paths.
- **Validation** with Zod on the client and again on the server for every action; database checks
  as the last line (lengths, ranges, enums).
- **Logging** never includes journal text, notes or profile details.
- **Security headers** on every response: HSTS, no framing (clickjacking), no MIME sniffing, a strict
  referrer policy, camera, microphone and location blocked, and cross-origin window isolation.
- **Offline support** caches a single static page (`public/offline.html`); no member page or data is
  ever stored by the service worker.
- **Storage:** one private bucket, `vision`, limited to 5 MB JPEG, PNG or WebP files. Deleting a
  picture or an account removes the files at once; a signed link that was already issued may be served
  from Supabase's CDN cache until it expires (at most one hour).
- **Place search** (`/api/places`, signed-in members only) sends only the typed text to Open-Meteo's
  free geocoding API; no identity, cookies or other data leave JournApp.

## Member rights

- **Access and portability:** Settings → Download my data (everything, as JSON).
- **Rectification:** Settings → Profile.
- **Erasure:** Settings → Delete account removes the account, every row and every stored picture.
- **Consent:** explicit at sign-up; prompts and reminders are opt-in; 18+ content asks first.

## Wellbeing safeguards

- `/help` is public and linked from Settings and from a very low check-in.
- The app says plainly that it is not a medical or crisis service and is not monitored.

## Before launch

- Privacy policy and terms reviewed by a lawyer; name a data controller and contact address.
- Signed data processing agreements with Supabase, Vercel, Mux and Resend.
- Supabase on Pro for daily backups; consider point-in-time recovery as the member base grows.
- Consider an independent security review once payments are added.

## Reporting a problem

Report suspected security issues privately to the JournApp team; do not open a public issue.
