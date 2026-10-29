-- Row level security: every member sees and changes only their own data.
-- Run with `pnpm db:test` (supabase test db).

begin;
create extension if not exists pgtap with schema extensions;

select plan(28);

-- Two members, created the way Supabase Auth creates them, so the profile trigger runs.
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'amara@example.test', '{"display_name":"Amara","timezone":"Africa/Nairobi"}', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'lina@example.test', '{"display_name":"Lina"}', 'authenticated', 'authenticated');

select is(
  (select count(*)::int from public.profiles where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')),
  2, 'the signup trigger creates a profile for each member');

select is(
  (select timezone from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Africa/Nairobi', 'the profile takes its timezone from signup metadata');

-- Act as Amara.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select lives_ok($$ insert into public.check_ins (local_date, mood, energy) values ('2026-10-29', 4, 3) $$,
  'a member can add a check-in');
select throws_ok($$ insert into public.check_ins (local_date, mood) values ('2026-10-29', 2) $$,
  '23505', null, 'a second check-in on the same day is rejected');
select throws_ok($$ insert into public.check_ins (local_date, mood) values ('2026-10-30', 9) $$,
  '23514', null, 'a mood outside 1-5 is rejected');
select throws_ok($$ insert into public.check_ins (user_id, local_date, mood) values ('22222222-2222-2222-2222-222222222222', '2026-10-29', 3) $$,
  '42501', null, 'a member cannot add a check-in for someone else');

select lives_ok($$ insert into public.journal_entries (body, local_date) values ('Amara private entry', '2026-10-29') $$,
  'a member can write a journal entry');
select lives_ok($$ insert into public.goals (id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Walk every morning') $$,
  'a member can set a goal');
select lives_ok($$ insert into public.goal_steps (goal_id, title, due_date) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Buy walking shoes', '2026-11-01') $$,
  'a member can add a step to their goal');
select lives_ok($$ insert into public.tracker_entries (local_date, kind, value) values ('2026-10-29', 'water', 6) $$,
  'a member can log a tracker entry');

select throws_ok($$ update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'a member cannot make themselves an admin');
select throws_ok($$ update public.profiles set plan = 'premium' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'a member cannot give themselves premium');
select lives_ok($$ update public.profiles set display_name = 'Amara W' where id = '11111111-1111-1111-1111-111111111111' $$,
  'a member can rename themselves');

-- Act as Lina.
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is((select count(*)::int from public.check_ins), 0, 'another member sees none of Amara''s check-ins');
select is((select count(*)::int from public.journal_entries), 0, 'another member sees none of Amara''s journal');
select is((select count(*)::int from public.goals), 0, 'another member sees none of Amara''s goals');
select is((select count(*)::int from public.goal_steps), 0, 'another member sees none of Amara''s steps');
select is((select count(*)::int from public.tracker_entries), 0, 'another member sees none of Amara''s tracking');
select is((select count(*)::int from public.profiles), 1, 'a member sees only their own profile');

update public.journal_entries set body = 'overwritten' where body = 'Amara private entry';
delete from public.goals where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select throws_ok($$ insert into public.goal_steps (goal_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Sneaky step') $$,
  '23503', null, 'a member cannot add a step to someone else''s goal');
select throws_ok($$ insert into public.quotes (body) values ('Not an admin') $$,
  '42501', null, 'a member cannot add content');
select ok((select count(*) from public.quotes) > 0, 'members can read the quotes');
select is((select count(*)::int from public.quote_for_day('2026-10-29')), 1, 'there is exactly one quote for a day');

select is(
  (select jsonb_array_length(public.export_my_data() -> 'journal_entries')), 0,
  'the export contains only the caller''s rows');

-- Back as Amara: her data was untouched by Lina's attempts.
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select body from public.journal_entries limit 1), 'Amara private entry', 'another member could not overwrite the journal');
select is((select count(*)::int from public.goals), 1, 'another member could not delete the goal');

select lives_ok($$ select public.delete_my_account() $$, 'a member can delete their own account');

reset role;
select is(
  (select count(*)::int from public.journal_entries where user_id = '11111111-1111-1111-1111-111111111111'),
  0, 'deleting the account removes everything the member stored');

select * from finish();
rollback;
