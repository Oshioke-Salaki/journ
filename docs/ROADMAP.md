# Roadmap

## Done in the first build

Welcome page with a live check-in · accounts and onboarding with the optional birth and profile
details · Today with quote, check-in, prompt, goal prompts, trackers and the circle of control · the
check-in with body map · journal with drafts, search, prompted writing · Discover and Community with
the 18+ gate · My Space reports, goals, plans and vision board · Settings with export and deletion ·
public support page · admin for videos, quotes, prompts and topics · light and dark · installable PWA.

## Next (before public launch)

- Real content, the welcome video and Mux uploads (client).
- Email: Resend as Supabase SMTP; branded auth emails.
- Daily reminder delivery: a scheduled job (Supabase cron or Vercel cron) that emails members with
  reminders on, at their chosen local time. The setting is already stored.
- Error alerts (Sentry) and privacy-friendly analytics (PostHog, EU hosting, no journal content).
- Legal review of the privacy policy and terms.

## Phase 2

- **Subscriptions** for premium videos and coaching. Stripe may not accept Kenya-based businesses;
  Paystack (cards and M-Pesa) is the likely alternative. Decide once the business is registered.
- **Coaching:** request a session, coach profiles, booking.
- **Weekly reflection:** an opt-in, AI-written summary of the week from check-ins (Claude).
- **Astrology and Human Design** insights from birth date, time and place (already collected).
- **Community discussions** between members, with moderation and reporting.
- Web push notifications for reminders (iOS supports them for installed apps).
- Cycle tracking alongside mood and energy, if Women's health is a focus.

## Phase 3

- Native iOS and Android apps with Expo (React Native), on the same Supabase backend.
- Home-screen widgets, Face ID lock, Apple Health and Google Fit.
- More languages (the profile already stores a language).
