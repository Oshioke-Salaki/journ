-- Row level security for the circle of control, the vision board, its storage and admin stats.

begin;
create extension if not exists pgtap with schema extensions;
-- The hosted CLI connects with a login role; act as postgres (as local tests do).
set local role postgres;
set local search_path to public, extensions;
select plan(12);

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('33333333-3333-3333-3333-333333333333', 'one@example.test', '{}', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'two@example.test', '{}', 'authenticated', 'authenticated');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);

select lives_ok($$ insert into public.control_items (local_date, body, zone) values ('2026-10-29', 'The Friday deadline', 'control') $$,
  'a member can add to their circle of control');
select lives_ok($$ insert into public.vision_items (kind, words) values ('words', 'Strong and calm') $$,
  'a member can add words to their vision board');
select throws_ok($$ insert into public.vision_items (kind) values ('image') $$,
  '23514', null, 'an image item needs a picture');
select throws_ok($$ insert into public.vision_items (kind, image_path) values ('image', '../../etc/passwd') $$,
  '23514', null, 'image paths must be a member folder and a uuid file name');
select lives_ok($$ insert into storage.objects (bucket_id, name, owner) values ('vision', '33333333-3333-3333-3333-333333333333/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp', '33333333-3333-3333-3333-333333333333') $$,
  'a member can store a picture in their own folder');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('vision', '44444444-4444-4444-4444-444444444444/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.webp') $$,
  '42501', null, 'a member cannot store a picture in someone else''s folder');
select throws_ok($$ select public.admin_stats() $$, '42501', null, 'a member cannot read admin stats');

select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select is((select count(*)::int from public.control_items), 0, 'another member sees none of the circle of control');
select is((select count(*)::int from public.vision_items), 0, 'another member sees none of the vision board');
select is((select count(*)::int from storage.objects where bucket_id = 'vision'), 0, 'another member sees none of the stored pictures');

set local role postgres;
update public.profiles set role = 'admin' where id = '44444444-4444-4444-4444-444444444444';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select ok((public.admin_stats() ->> 'members')::int >= 2, 'an admin reads the totals');
select is((select count(*)::int from public.control_items), 0, 'an admin still cannot read members'' private rows');

select * from finish();
rollback;
