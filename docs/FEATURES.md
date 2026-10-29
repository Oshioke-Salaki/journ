# Features

Every screen, mapped to the client's sketches. "States" lists what each screen shows beyond the
happy path.

## Welcome (`/`)

From the sketch: tagline, link to video, sign in, sign up.

- Headline "Notice what you can control." with the tagline as the supporting line.
- **Live check-in:** choose a mood; the landscape rises or settles and a matching prompt appears.
- "Watch the introduction" opens the welcome video (placeholder until recorded).
- How it works (check in, write, take the next step) shown with real interface pieces; the six
  topics; privacy promises; a final call to action; legal links.
- Signed-in members go straight to Today.

## Accounts

- **Sign up** (`/sign-up`): first name, email, password (rules shown under the field), consent to terms
  and privacy. Timezone captured automatically. If email confirmation is on, a "Check your email" state.
- **Sign in** (`/sign-in`): returns to the page the member was going to. Clear errors for a wrong
  password, an unconfirmed email and rate limits. An expired email link shows its own message.
- **Forgot / reset password:** never reveals whether an email has an account.
- **Onboarding** (`/onboarding`), from the sketch's optional details: name; date and time of birth;
  place of birth as a searchable list of real towns (its coordinates and timezone are saved for
  astrology); country as a searchable dropdown; pronouns (all optional, skippable); consent to goal
  prompts and a daily reminder (from "prompts to meet goals (when agreed)"). Language is English for
  now, so it is not asked; the profile stores it for when more languages arrive.

## Today (`/today`)

From the sketch: Today, Quote, Prompts to meet goals (when agreed), How I feel, Other things to
track, Free journaling.

- Greeting by time of day in the member's timezone, with the day's fact.
- **How I feel:** if not checked in, tap a mood to start the check-in with it set; once done, today's
  landscape, mood, the three levels, body notes, feeling words and note, with Update.
- **Quote:** the day's quote.
- **Write:** the day's prompt, "Write about this" and "Free writing".
- **Towards your goals:** the next step of each active goal, tickable here, only if goal prompts are on.
- **Other things to track:** water, sleep, movement, stillness, eating; saves as you tap.
- **What can I control?:** today's sorting at a glance.
- An "Add to home screen" card on phones that haven't installed the app.

## Check-in (`/check-in`)

From "How I feel": overall mood, where in my body, energy levels, efficiency, self-satisfaction.

1. Mood (five levels, with a sun-height glyph; the landscape responds).
2. Body map: tap areas on the figure (or the back chips), then choose a sensation for each.
3. Energy, efficiency and self-satisfaction.
4. Feeling words and a note.

One check-in per day; opening it again edits today's. Keyboard support throughout. A very low mood
shows a gentle link to support.

## Journal (`/journal`, `/journal/new`, `/journal/[id]`)

From "Free journaling: free writing, prompted writing".

- Full-screen editor in a serif face; title optional; word count; shuffle or drop the prompt.
- Drafts are kept on the device as you type and restored if the tab closes; Cmd/Ctrl+S saves; a
  warning appears before leaving with unsaved words. Drafts are per member and cleared on sign-out.
- List grouped by month, search as you type, a reading view, edit and delete (with confirmation).

## Circle of control (`/control`)

The tagline as a practice: add what is on your mind, sort each thought into "I control",
"I influence" or "Not mine", see the circles fill, and turn controllable thoughts into a step of an
existing goal or a new goal.

## Discover (`/discover`, `/discover/[id]`)

From the sketch: a grid of videos.

- Filter by topic instantly (kept in the URL). Free and premium labels, length, type.
- Video page: Mux player once the video is uploaded; until then an honest "being recorded" state.
  Premium videos show "Part of JournApp Premium, coming soon" to free members. Related videos.

## Community (`/community`, `/community/[slug]`)

From the sketch: Nutrition, Breathing, Women stuff (now "Women's health"), Exercise (now
"Movement"), Sexuality, Coaching.

- Each topic: introduction, its videos, its prompts (one tap to write).
- Sexuality asks once for confirmation of age 18+.
- Coaching explains that one-to-one coaching opens soon and offers the recorded sessions.

## My Space (`/space`)

From the sketch: My goals (set goals, check goals, my vision board), My plans, My reports.

- **My reports:** last 7 days as landscapes, a 30-day mood chart (gaps for days without a check-in),
  where in the body and which words came up most, daily habit averages; totals for days checked in,
  streak, entries and steps completed.
- **My goals** (`/space/goals`): grouped by in progress, paused, achieved; set a goal with why, area,
  target date and first steps; each goal page has progress, steps (tick, add, remove), edit, pause,
  achieve, delete.
- **My plans:** open dated steps, soonest first, overdue marked.
- **My vision board** (`/space/vision`): pictures (compressed in the browser, stored privately) and
  words.

## Settings (`/settings`)

Profile and optional details; goal prompts and reminder time; appearance (match device, light,
dark); download my data (JSON); support; sign out; delete account (type DELETE). Admins see a link
to the admin area.

## Support (`/help`)

Public, no sign-in needed: emergency numbers for Kenya (999, 112) as tap-to-call, the international
helpline directory, and a 5-4-3-2-1 grounding exercise.

## Admin (`/admin`)

Admins only; everyone else sees "not found".

- **Overview:** members, new this week, active this week, premium; sign-ups for 14 days; check-ins,
  entries and goals this week; content status. Totals only.
- **Videos:** list with live switch; add and edit (title, description, topic, type, free/premium,
  length, presenter, Mux playback ID, published).
- **Quotes, prompts:** add, edit, switch live, delete.
- **Topics:** edit names, introductions and the 18+ flag.

Changes reach every member immediately.

## Not found and errors

- **Public 404:** a calm landscape, "This page isn't here", and ways back (JournApp, support).
- **404 inside the app:** the same message with the navigation kept, plus shortcuts to Today,
  Journal, My Space and support. Entries, goals and videos that don't exist (or belong to someone
  else) land here.
- **Errors:** a screen that fails to load says so inside the app, with Try again and Go to Today; a
  failure of the whole app shows a plain fallback that needs no styles.
- **Admin:** anyone who is not an admin gets the public 404 with no sign of the admin area.

## Empty states

Every list and section has one, written as the next step: Today before the first check-in, the
journal and search with no results, My reports before any data, no goals, no plans, an empty circle
of control, an empty vision board, Discover with no videos or none in a topic, a topic without
videos or prompts, and the admin lists. The screenshot run captures them on a fresh account.

## Everywhere

- Light and dark mode; phone, tablet and desktop layouts; installable as an app.
- Skeletons while loading, empty states that say how to start, errors inside the block that failed,
  toasts for saves, optimistic updates that roll back on failure.
