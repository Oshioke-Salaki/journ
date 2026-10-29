-- Circle of control, vision board, and the admin overview.

-- ---------------------------------------------------------------------------------------------
-- Circle of control: what is on the member's mind, sorted into what they control, what they can
-- influence, and what is outside their control. Controllable items can become goal steps.
-- ---------------------------------------------------------------------------------------------

create type public.control_zone as enum ('control', 'influence', 'outside');

create table public.control_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  body text not null check (char_length(body) between 1 and 200),
  zone public.control_zone,
  goal_step_id uuid references public.goal_steps (id) on delete set null,
  created_at timestamptz not null default now()
);

create index control_items_user_date_idx on public.control_items (user_id, local_date desc, created_at);

-- ---------------------------------------------------------------------------------------------
-- Vision board: pictures (in private storage) and words.
-- ---------------------------------------------------------------------------------------------

create type public.vision_kind as enum ('image', 'words');

create table public.vision_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.vision_kind not null,
  image_path text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'),
  words text check (char_length(words) <= 160),
  caption text check (char_length(caption) <= 120),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  check ((kind = 'image' and image_path is not null) or (kind = 'words' and words is not null))
);

create index vision_items_user_idx on public.vision_items (user_id, position, created_at);

alter table public.control_items enable row level security;
alter table public.vision_items enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['control_items', 'vision_items'] loop
    execute format('create policy "Members read their own rows" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "Members add their own rows" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "Members change their own rows" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "Members delete their own rows" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- Private bucket: each member's files live under a folder named with their user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vision', 'vision', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Members read their own vision images" on storage.objects for select to authenticated
  using (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members upload their own vision images" on storage.objects for insert to authenticated
  with check (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members delete their own vision images" on storage.objects for delete to authenticated
  using (bucket_id = 'vision' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Export covers the new tables too.
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
    'vision_items', coalesce((select jsonb_agg(v order by v.position, v.created_at) from public.vision_items v), '[]'::jsonb)
  );
$$;

-- Stored images are removed by the app through the Storage API before the account is deleted
-- (Supabase does not allow deleting storage objects from SQL).

-- ---------------------------------------------------------------------------------------------
-- Admin overview: totals only. No admin can read any member's check-ins, journal or goals.
-- ---------------------------------------------------------------------------------------------

create function public.admin_stats()
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
    'signups_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'n', coalesce(n, 0)) order by d), '[]'::jsonb)
      from generate_series(current_date - 13, current_date, interval '1 day') d
      left join (select created_at::date as day, count(*) as n from public.profiles group by 1) s on s.day = d::date
    )
  );
end;
$$;

revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;
