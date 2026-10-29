-- Sample content for development and the first preview.
-- Everything here is placeholder content to be replaced by the JournApp team before launch.
-- Quotes without an author are original lines written for JournApp.

insert into public.topics (slug, title, summary, is_mature, sort) values
  ('nutrition', 'Nutrition', 'Eating in a way that steadies your energy and your mood, without rules that make food a source of stress.', false, 1),
  ('breathing', 'Breathing', 'Short breathing practices that calm the nervous system, help you focus and make room between a feeling and a reaction.', false, 2),
  ('womens-health', 'Women''s health', 'Your cycle, hormones and the stages of life, and how each one shapes your energy, sleep and emotions.', false, 3),
  ('movement', 'Movement', 'Gentle and energising ways to move, chosen by how your body feels today rather than by how hard you can push.', false, 4),
  ('sexuality', 'Sexuality', 'Desire, intimacy and confidence, explored openly and without judgement. For members aged 18 and over.', true, 5),
  ('coaching', 'Coaching', 'Recorded coaching sessions on habits, confidence and change, with the option to connect with a coach.', false, 6);

insert into public.prompts (body, topic_slug) values
  ('What is one thing within your control today, and one thing you can let go of?', null),
  ('What drained your energy this week, and what gave some back?', null),
  ('Describe a moment today when you felt most like yourself.', null),
  ('What would you do today if you trusted yourself completely?', null),
  ('Which worry is taking up the most space right now? What part of it can you act on?', null),
  ('What are you proud of that nobody else noticed?', null),
  ('What does your body need from you this evening?', null),
  ('Write a short letter to yourself one year from now.', null),
  ('What boundary would make next week easier?', null),
  ('What are three small things that went right today?', null),
  ('Where in your life are you waiting for permission? Who are you waiting on?', null),
  ('What emotion visited you most today? What was it trying to tell you?', null),
  ('How did you eat today, and how did it make you feel afterwards?', 'nutrition'),
  ('Which foods leave you steady and which leave you tired?', 'nutrition'),
  ('Take five slow breaths. What changed in your body?', 'breathing'),
  ('When did you last notice yourself holding your breath?', 'breathing'),
  ('Where are you in your cycle, and how is it showing up in your mood?', 'womens-health'),
  ('What would you like the people around you to understand about your body this week?', 'womens-health'),
  ('What kind of movement would feel kind today?', 'movement'),
  ('How does your body feel after you move compared with before?', 'movement'),
  ('What helps you feel at home in your own body?', 'sexuality'),
  ('What does intimacy mean to you right now?', 'sexuality'),
  ('What habit would you like to build, and what usually gets in the way?', 'coaching'),
  ('If a coach asked what you want from the next three months, what would you say?', 'coaching');

insert into public.quotes (body, author, source, created_at) values
  ('Some things are under our control, while others are not under our control.', 'Epictetus', 'Enchiridion, translated by W. A. Oldfather', '2026-01-01 00:00:00+00'),
  ('Notice what you can change today. Leave the rest for later.', null, null, '2026-01-01 00:01:00+00'),
  ('Your feelings are information, not instructions.', null, null, '2026-01-01 00:02:00+00'),
  ('Rest is part of the work.', null, null, '2026-01-01 00:03:00+00'),
  ('A small step taken today is worth more than a perfect plan for tomorrow.', null, null, '2026-01-01 00:04:00+00'),
  ('You can be a work in progress and still be enough.', null, null, '2026-01-01 00:05:00+00'),
  ('Breathe first. Then decide.', null, null, '2026-01-01 00:06:00+00'),
  ('Kindness towards yourself is not a reward for finishing. It is how you begin.', null, null, '2026-01-01 00:07:00+00'),
  ('The body keeps a diary too. Today, read a page.', null, null, '2026-01-01 00:08:00+00'),
  ('Progress is often quiet. Write it down so you can hear it.', null, null, '2026-01-01 00:09:00+00'),
  ('You do not have to carry every worry at once. Pick one, and set the others down.', null, null, '2026-01-01 00:10:00+00'),
  ('Energy is a budget. Spend it on what matters to you.', null, null, '2026-01-01 00:11:00+00'),
  ('Saying no to one thing is saying yes to another.', null, null, '2026-01-01 00:12:00+00'),
  ('Begin where you are, with what you have today.', null, null, '2026-01-01 00:13:00+00');

insert into public.videos (title, description, topic_slug, kind, tier, duration_seconds, is_published, published_at, sort) values
  ('Four-count breathing for a busy mind', 'A short guided practice: breathe in for four, hold for four, out for four, hold for four. Use it before a hard conversation or when you cannot settle.', 'breathing', 'practice', 'free', 360, true, now(), 1),
  ('The long exhale', 'Lengthening the out-breath is one of the quickest ways to tell the body it is safe. Ten minutes, seated or lying down.', 'breathing', 'practice', 'free', 600, true, now(), 2),
  ('Eating for steady energy', 'Why some meals leave you flat by mid-afternoon, and simple swaps that keep energy level through the day.', 'nutrition', 'lesson', 'free', 720, true, now(), 1),
  ('Mindful eating, one meal at a time', 'A practice for noticing hunger, fullness and how food makes you feel, without counting anything.', 'nutrition', 'practice', 'premium', 540, true, now(), 2),
  ('Your cycle and your energy', 'The four phases of the menstrual cycle and how each can change your mood, sleep, appetite and focus.', 'womens-health', 'lesson', 'free', 900, true, now(), 1),
  ('Sleep and hormones', 'How hormonal changes affect sleep across the month and through the stages of life, and what helps.', 'womens-health', 'lesson', 'premium', 840, true, now(), 2),
  ('Morning mobility in eight minutes', 'Wake up the spine, hips and shoulders before the day starts. No equipment needed.', 'movement', 'practice', 'free', 480, true, now(), 1),
  ('Gentle strength for low-energy days', 'A slow, supportive session for the days when your body asks for less, not nothing.', 'movement', 'practice', 'premium', 1200, true, now(), 2),
  ('Confidence in your own body', 'A conversation about body image, desire and how to feel at home in yourself.', 'sexuality', 'lesson', 'premium', 1080, true, now(), 1),
  ('Talking about what you need', 'How to start honest conversations about intimacy with a partner.', 'sexuality', 'lesson', 'premium', 960, true, now(), 2),
  ('Coaching session: building one habit that lasts', 'A recorded coaching session on choosing one habit, making it small and keeping it going.', 'coaching', 'coaching_session', 'free', 1800, true, now(), 1),
  ('Coaching session: when motivation runs out', 'A recorded coaching session on what to do on the days you do not feel like it.', 'coaching', 'coaching_session', 'premium', 2100, true, now(), 2),
  ('What you can control', 'An introduction to the idea at the heart of JournApp: sorting what is yours to act on from what is not.', null, 'lesson', 'free', 420, true, now(), 0);
