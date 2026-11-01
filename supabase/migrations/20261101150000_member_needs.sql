-- What members need day to day: journal tags, saved videos, a feedback inbox, dismissing the
-- first-week checklist, and two-step sign-in.

-- ---------------------------------------------------------------------------------------------
-- Journal tags: short lowercase words, at most 10 per entry.
-- ---------------------------------------------------------------------------------------------

create function public.valid_tags(tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(tags) <= 10
    and coalesce(bool_and(t ~ '^[a-z0-9][a-z0-9 -]{0,29}$'), true)
  from unnest(tags) t;
$$;

alter table public.journal_entries
  add column tags text[] not null default '{}' check (public.valid_tags(tags));

create index journal_entries_tags_idx on public.journal_entries using gin (tags);
create index journal_entries_user_date_idx on public.journal_entries (user_id, local_date);

-- ---------------------------------------------------------------------------------------------
-- First-week checklist on Today
-- ---------------------------------------------------------------------------------------------

alter table public.profiles add column checklist_dismissed_at timestamptz;
grant update (checklist_dismissed_at) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Saved videos ("Watch later")
-- ---------------------------------------------------------------------------------------------

create table public.saved_videos (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index saved_videos_video_idx on public.saved_videos (video_id);
create index saved_videos_user_created_idx on public.saved_videos (user_id, created_at desc);

alter table public.saved_videos enable row level security;

create policy "Members read their saved videos" on public.saved_videos for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Members save videos" on public.saved_videos for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Members unsave videos" on public.saved_videos for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Feedback: members write to the team; admins read and mark it handled.
-- ---------------------------------------------------------------------------------------------

create type public.feedback_kind as enum ('idea', 'problem', 'other');
create type public.feedback_status as enum ('new', 'done');

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.feedback_kind not null default 'other',
  body text not null check (char_length(body) between 5 and 2000),
  page text check (char_length(page) <= 200),
  status public.feedback_status not null default 'new',
  created_at timestamptz not null default now()
);

comment on table public.feedback is 'Messages from members to the team. Admins see them with the sender''s email.';

create index feedback_user_idx on public.feedback (user_id);
create index feedback_status_created_idx on public.feedback (status, created_at desc);

alter table public.feedback enable row level security;

create policy "Members read their own feedback" on public.feedback for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Members send feedback" on public.feedback for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'new');
create policy "Admins mark feedback" on public.feedback for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke update on public.feedback from authenticated, anon;
grant update (status) on public.feedback to authenticated;

create function public.admin_list_feedback(only_status public.feedback_status default null)
returns table (id uuid, kind public.feedback_kind, body text, page text, status public.feedback_status, created_at timestamptz, email text, display_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select f.id, f.kind, f.body, f.page, f.status, f.created_at, u.email::text, p.display_name
    from public.feedback f
    join auth.users u on u.id = f.user_id
    left join public.profiles p on p.id = f.user_id
    where only_status is null or f.status = only_status
    order by f.created_at desc
    limit 200;
end;
$$;

revoke execute on function public.admin_list_feedback(public.feedback_status) from public, anon;
grant execute on function public.admin_list_feedback(public.feedback_status) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Two-step sign-in: once a member has set up an authenticator app, a session only reaches their
-- data (and admin powers) after passing it (aal2). Members without a factor are unaffected.
-- ---------------------------------------------------------------------------------------------

create function public.mfa_satisfied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified'
    );
$$;

revoke execute on function public.mfa_satisfied() from public, anon;
grant execute on function public.mfa_satisfied() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  ) and public.mfa_satisfied();
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'check_ins', 'tracker_entries', 'journal_entries', 'goals', 'goal_steps',
                           'control_items', 'vision_items', 'saved_videos', 'feedback'] loop
    execute format('create policy "Two-step sign-in is passed" on public.%I as restrictive for all to authenticated using ((select public.mfa_satisfied())) with check ((select public.mfa_satisfied()))', t);
  end loop;
end;
$$;

create policy "Two-step sign-in is passed for pictures" on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'vision' or (select public.mfa_satisfied()))
  with check (bucket_id <> 'vision' or (select public.mfa_satisfied()));

-- ---------------------------------------------------------------------------------------------
-- Admin overview gains the number of unread messages.
-- ---------------------------------------------------------------------------------------------

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'members', (select count(*) from public.profiles),
    'members_onboarded', (select count(*) from public.profiles where onboarded_at is not null),
    'members_new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'members_premium', (select count(*) from public.profiles where plan = 'premium'),
    'active_7d', (select count(distinct user_id) from public.check_ins where created_at > now() - interval '7 days'),
    'check_ins_7d', (select count(*) from public.check_ins where created_at > now() - interval '7 days'),
    'entries_7d', (select count(*) from public.journal_entries where created_at > now() - interval '7 days'),
    'goals_active', (select count(*) from public.goals where status = 'active'),
    'feedback_new', (select count(*) from public.feedback where status = 'new'),
    'signups_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'n', coalesce(n, 0)) order by d), '[]'::jsonb)
      from generate_series(current_date - 13, current_date, interval '1 day') d
      left join (select created_at::date as day, count(*) as n from public.profiles group by 1) s on s.day = d::date
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Export includes everything new.
-- ---------------------------------------------------------------------------------------------

create or replace function public.export_my_data()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'role' from public.profiles p where p.id = (select auth.uid())),
    'check_ins', coalesce((select jsonb_agg(c order by c.local_date) from public.check_ins c), '[]'::jsonb),
    'tracker_entries', coalesce((select jsonb_agg(t order by t.local_date) from public.tracker_entries t), '[]'::jsonb),
    'journal_entries', coalesce((select jsonb_agg(j order by j.created_at) from public.journal_entries j), '[]'::jsonb),
    'goals', coalesce((select jsonb_agg(g order by g.created_at) from public.goals g), '[]'::jsonb),
    'goal_steps', coalesce((select jsonb_agg(s order by s.created_at) from public.goal_steps s), '[]'::jsonb),
    'control_items', coalesce((select jsonb_agg(ci order by ci.created_at) from public.control_items ci), '[]'::jsonb),
    'vision_items', coalesce((select jsonb_agg(v order by v.position, v.created_at) from public.vision_items v), '[]'::jsonb),
    'saved_videos', coalesce((select jsonb_agg(sv order by sv.created_at) from public.saved_videos sv where sv.user_id = (select auth.uid())), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(f order by f.created_at) from public.feedback f where f.user_id = (select auth.uid())), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------------------------
-- A member who lost their phone: an admin resets two-step sign-in after checking it's them.
-- ---------------------------------------------------------------------------------------------

create function public.admin_reset_two_step(target_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select u.id into target from auth.users u where lower(u.email) = lower(trim(target_email));
  if target is null then
    return 'not_found';
  end if;
  if not exists (select 1 from auth.mfa_factors where user_id = target) then
    return 'none';
  end if;
  delete from auth.mfa_factors where user_id = target;
  return 'ok';
end;
$$;

revoke execute on function public.admin_reset_two_step(text) from public, anon;
grant execute on function public.admin_reset_two_step(text) to authenticated;
