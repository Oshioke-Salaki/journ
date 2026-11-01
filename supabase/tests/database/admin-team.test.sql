-- Admin team management: only admins, never yourself, never the last admin.
begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
set local search_path to public, extensions;
select plan(8);

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('55555555-5555-5555-5555-555555555555', 'boss@example.test', '{}', 'authenticated', 'authenticated'),
  ('66666666-6666-6666-6666-666666666666', 'helper@example.test', '{}', 'authenticated', 'authenticated');
update public.profiles set role = 'admin' where id <> '55555555-5555-5555-5555-555555555555' and role = 'admin';
update public.profiles set role = 'member' where role = 'admin';
update public.profiles set role = 'admin' where id = '55555555-5555-5555-5555-555555555555';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}', true);
select throws_ok($$ select public.admin_set_role('helper@example.test', true) $$, '42501', null, 'a member cannot make anyone an admin');
select throws_ok($$ select public.admin_list_admins() $$, '42501', null, 'a member cannot list admins');

select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
select is(public.admin_set_role('boss@example.test', false), 'self', 'an admin cannot remove themselves');
select is(public.admin_set_role('nobody@example.test', true), 'not_found', 'an unknown email is reported');
select is(public.admin_set_role('HELPER@example.test', true), 'ok', 'an admin can add another admin (email case does not matter)');
select is((select count(*)::int from public.admin_list_admins()), 2, 'both admins are listed');
select is(public.admin_set_role('helper@example.test', false), 'ok', 'an admin can remove another admin');

select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}', true);
set local role postgres;
update public.profiles set role = 'member' where id = '55555555-5555-5555-5555-555555555555';
update public.profiles set role = 'admin' where id = '66666666-6666-6666-6666-666666666666';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}', true);
select is(public.admin_set_role('helper@example.test', false), 'self', 'the last admin cannot be removed (self check comes first)');

select * from finish();
rollback;
