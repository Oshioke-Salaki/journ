-- Tags, saved videos, feedback, the checklist flag and two-step sign-in for admins.
begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
set local search_path to public, extensions;
select plan(26);

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('77777777-7777-7777-7777-777777777777', 'wanjiru@example.test', '{}', 'authenticated', 'authenticated'),
  ('88888888-8888-8888-8888-888888888888', 'zola@example.test', '{}', 'authenticated', 'authenticated'),
  ('99999999-9999-9999-9999-999999999999', 'chief@example.test', '{}', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id = '99999999-9999-9999-9999-999999999999';
insert into public.videos (id, title, duration_seconds, is_published, published_at)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Test video', 60, true, now());

-- Wanjiru: tags, saved videos, feedback, checklist.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}', true);

select lives_ok($$ insert into public.journal_entries (body, local_date, tags) values ('Tagged', '2026-11-01', '{work,self care}') $$,
  'an entry can carry tags');
select throws_ok($$ insert into public.journal_entries (body, local_date, tags) values ('Bad', '2026-11-01', '{Work!}') $$,
  '23514', null, 'tags must be short lowercase words');
select throws_ok($$ insert into public.journal_entries (body, local_date, tags) values ('Many', '2026-11-01', '{a,b,c,d,e,f,g,h,i,j,k}') $$,
  '23514', null, 'an entry has at most 10 tags');

select lives_ok($$ insert into public.saved_videos (video_id) values ('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'a member can save a video');
select throws_ok($$ insert into public.saved_videos (user_id, video_id) values ('88888888-8888-8888-8888-888888888888', 'aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', null, 'a member cannot save a video for someone else');

select lives_ok($$ insert into public.feedback (kind, body, page) values ('problem', 'The chart is blank on my phone', '/space') $$,
  'a member can send feedback');
select throws_ok($$ insert into public.feedback (body, status) values ('Already done?', 'done') $$,
  '42501', null, 'a member cannot file feedback as handled');
select throws_ok($$ update public.feedback set body = 'changed' $$,
  '42501', null, 'a member cannot rewrite feedback');
select throws_ok($$ select public.admin_list_feedback() $$, '42501', null, 'a member cannot open the inbox');

select lives_ok($$ update public.profiles set checklist_dismissed_at = now() where id = '77777777-7777-7777-7777-777777777777' $$,
  'a member can dismiss the checklist');
select ok((select (export_my_data() -> 'saved_videos') is not null and jsonb_array_length(export_my_data() -> 'feedback') = 1),
  'the export includes saved videos and feedback');

-- Zola sees none of it.
select set_config('request.jwt.claims', '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}', true);
select is((select count(*)::int from public.saved_videos), 0, 'saved videos are private');
select is((select count(*)::int from public.feedback), 0, 'feedback is private to its sender');
select is((select count(*)::int from public.journal_entries where 'work' = any(tags)), 0, 'tagged entries are private');

-- The admin reads and handles it.
select set_config('request.jwt.claims', '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated","aal":"aal1"}', true);
select is((select email from public.admin_list_feedback() limit 1), 'wanjiru@example.test', 'admins see who wrote in');
select lives_ok($$ update public.feedback set status = 'done' $$, 'admins can mark feedback handled');
select is((select count(*)::int from public.admin_list_feedback('new')), 0, 'the inbox filters by status');

-- Two-step sign-in: with a verified factor, an aal1 session is not an admin until it passes it.
set local role postgres;
insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at)
values (gen_random_uuid(), '99999999-9999-9999-9999-999999999999', 'phone', 'totp', 'verified', now(), now());
set local role authenticated;
select is(public.is_admin(), false, 'an admin with an authenticator is not an admin at aal1');
select set_config('request.jwt.claims', '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated","aal":"aal2"}', true);
select is(public.is_admin(), true, 'the same admin is an admin once the code is entered');
select set_config('request.jwt.claims', '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated","aal":"aal2"}', true);
select throws_ok($$ select public.admin_set_role('zola@example.test', true) $$, '42501', null, 'a member still cannot manage admins');

-- A member with an authenticator: password alone (aal1) reaches none of her data.
set local role postgres;
insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at)
values (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'phone', 'totp', 'verified', now(), now());
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.journal_entries), 0, 'with two-step on, a password-only session reads no entries');
select throws_ok($$ insert into public.check_ins (local_date, mood) values ('2026-11-01', 3) $$, '42501', null, 'and cannot write');
select set_config('request.jwt.claims', '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated","aal":"aal2"}', true);
select is((select count(*)::int from public.journal_entries), 1, 'after the code, everything is there');
select throws_ok($$ select public.admin_reset_two_step('wanjiru@example.test') $$, '42501', null, 'a member cannot reset two-step sign-in');

-- The admin (past their own code) resets it for her.
select set_config('request.jwt.claims', '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated","aal":"aal2"}', true);
select is(public.admin_reset_two_step('WANJIRU@example.test'), 'ok', 'an admin can reset two-step sign-in for a member');
select is(public.admin_reset_two_step('wanjiru@example.test'), 'none', 'a second reset reports there is nothing to reset');

select * from finish();
rollback;
