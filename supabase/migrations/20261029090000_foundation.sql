-- JournApp foundation schema.
--
-- Conventions
--   * Every user-owned table has `user_id uuid not null default auth.uid()` and RLS policies that
--     compare it with `(select auth.uid())` (the sub-select lets Postgres cache the call per statement).
--   * `local_date` is the member's calendar day in their own timezone, computed on the server from
--     `profiles.timezone`. It is what "today" means everywhere in the product.
--   * Content tables (quotes, prompts, topics, videos) are read-only for members and written by
--     admins or the service role.

create extension if not exists moddatetime schema extensions;

-- ---------------------------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------------------------

create type public.member_role as enum ('member', 'admin');
create type public.member_plan as enum ('free', 'premium');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 60),
  pronouns text check (char_length(pronouns) <= 40),
  date_of_birth date check (date_of_birth > '1900-01-01' and date_of_birth < current_date),
  birth_time time,
  birth_place text check (char_length(birth_place) <= 120),
  country text check (country ~ '^[A-Z]{2}$'),
  language text not null default 'en' check (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  timezone text not null default 'UTC' check (char_length(timezone) <= 64),
  goal_prompts_enabled boolean not null default false,
  reminders_enabled boolean not null default false,
  reminder_time time not null default '20:00',
  mature_content_confirmed_at timestamptz,
  onboarded_at timestamptz,
  role public.member_role not null default 'member',
  plan public.member_plan not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per member, created by trigger when the auth user is created.';
comment on column public.profiles.birth_time is 'Optional. Used for astrology and Human Design features (planned).';
comment on column public.profiles.role is 'Not writable by members; see column grants below.';
comment on column public.profiles.plan is 'Not writable by members; set by billing (service role).';

create trigger profiles_updated_at before update on public.profiles
  for each row execute function extensions.moddatetime (updated_at);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, timezone)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'UTC')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check used by content policies. Security definer so it can read profiles without
-- recursing through the profiles policies.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

create policy "Members read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Members update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Members may only change these columns; role and plan stay server-controlled.
revoke update on public.profiles from authenticated, anon;
grant update (
  display_name, pronouns, date_of_birth, birth_time, birth_place, country, language, timezone,
  goal_prompts_enabled, reminders_enabled, reminder_time, mature_content_confirmed_at, onboarded_at
) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Daily check-ins ("How I feel")
-- ---------------------------------------------------------------------------------------------

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  mood smallint not null check (mood between 1 and 5),
  energy smallint check (energy between 1 and 5),
  efficiency smallint check (efficiency between 1 and 5),
  self_satisfaction smallint check (self_satisfaction between 1 and 5),
  -- [{ "area": "shoulders", "sensation": "tension" }, ...]
  body jsonb not null default '[]'::jsonb check (jsonb_typeof(body) = 'array' and jsonb_array_length(body) <= 24),
  feelings text[] not null default '{}' check (cardinality(feelings) <= 12),
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_date)
);

comment on table public.check_ins is 'At most one check-in per member per local day; later check-ins update it.';

create index check_ins_user_date_idx on public.check_ins (user_id, local_date desc);

create trigger check_ins_updated_at before update on public.check_ins
  for each row execute function extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------------------------
-- Habit tracking ("Other things to track")
-- ---------------------------------------------------------------------------------------------

create type public.tracker_kind as enum ('water', 'sleep', 'movement', 'nutrition', 'meditation');

create table public.tracker_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  kind public.tracker_kind not null,
  value numeric(8, 2) not null check (value >= 0 and value <= 100000),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index tracker_entries_user_date_idx on public.tracker_entries (user_id, local_date desc, kind);

-- ---------------------------------------------------------------------------------------------
-- Content: topics, prompts, quotes, videos
-- ---------------------------------------------------------------------------------------------

create type public.content_tier as enum ('free', 'premium');
create type public.video_kind as enum ('lesson', 'practice', 'coaching_session');

create table public.topics (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  title text not null check (char_length(title) <= 60),
  summary text not null check (char_length(summary) <= 400),
  is_mature boolean not null default false,
  sort smallint not null default 0
);

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 5 and 280),
  topic_slug text references public.topics (slug) on update cascade on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 5 and 400),
  author text check (char_length(author) <= 120),
  source text check (char_length(source) <= 160),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 120),
  description text not null default '' check (char_length(description) <= 2000),
  topic_slug text references public.topics (slug) on update cascade on delete set null,
  kind public.video_kind not null default 'lesson',
  tier public.content_tier not null default 'free',
  duration_seconds integer not null check (duration_seconds between 1 and 86400),
  host_name text check (char_length(host_name) <= 80),
  mux_playback_id text,
  poster_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create index videos_topic_idx on public.videos (topic_slug, sort) where is_published;

alter table public.topics enable row level security;
alter table public.prompts enable row level security;
alter table public.quotes enable row level security;
alter table public.videos enable row level security;

create policy "Anyone signed in reads topics" on public.topics for select to authenticated using (true);
create policy "Admins manage topics" on public.topics for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Members read active prompts" on public.prompts for select to authenticated
  using (is_active or (select public.is_admin()));
create policy "Admins manage prompts" on public.prompts for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Members read active quotes" on public.quotes for select to authenticated
  using (is_active or (select public.is_admin()));
create policy "Admins manage quotes" on public.quotes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Members read published videos" on public.videos for select to authenticated
  using (is_published or (select public.is_admin()));
create policy "Admins manage videos" on public.videos for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- The quote for a given day: the same for every member, rotating through active quotes.
create function public.quote_for_day(day date)
returns setof public.quotes
language sql
stable
security invoker
set search_path = ''
as $$
  with active as (
    select q.*, row_number() over (order by q.created_at, q.id) - 1 as idx, count(*) over () as total
    from public.quotes q
    where q.is_active
  )
  select id, body, author, source, is_active, created_at
  from active
  where idx = mod(mod((day - date '2026-01-01'), total) + total, total);
$$;

-- ---------------------------------------------------------------------------------------------
-- Journal
-- ---------------------------------------------------------------------------------------------

create type public.journal_kind as enum ('free', 'prompted');

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.journal_kind not null default 'free',
  prompt_id uuid references public.prompts (id) on delete set null,
  prompt_body text check (char_length(prompt_body) <= 280),
  title text check (char_length(title) <= 120),
  body text not null default '' check (char_length(body) <= 50000),
  local_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.journal_entries.prompt_body is 'Copy of the prompt at writing time, so the entry reads the same if the prompt is edited.';

create index journal_entries_user_created_idx on public.journal_entries (user_id, created_at desc);

create trigger journal_entries_updated_at before update on public.journal_entries
  for each row execute function extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------------------------
-- Goals and plans
-- ---------------------------------------------------------------------------------------------

create type public.goal_area as enum ('body', 'mind', 'relationships', 'work', 'growth', 'other');
create type public.goal_status as enum ('active', 'achieved', 'paused');

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  why text check (char_length(why) <= 1000),
  area public.goal_area not null default 'growth',
  status public.goal_status not null default 'active',
  target_date date,
  achieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_idx on public.goals (user_id, status, created_at desc);

create trigger goals_updated_at before update on public.goals
  for each row execute function extensions.moddatetime (updated_at);

-- A goal's steps. Steps with a date make up "My plans".
create table public.goal_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  due_date date,
  done_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index goal_steps_goal_idx on public.goal_steps (goal_id, position);
create index goal_steps_user_due_idx on public.goal_steps (user_id, due_date) where done_at is null;

-- A step must belong to a goal owned by the same member.
create function public.goal_steps_check_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.goals g where g.id = new.goal_id and g.user_id = new.user_id) then
    raise exception 'goal not found' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger goal_steps_owner before insert or update of goal_id, user_id on public.goal_steps
  for each row execute function public.goal_steps_check_owner();

-- ---------------------------------------------------------------------------------------------
-- RLS for member-owned tables
-- ---------------------------------------------------------------------------------------------

alter table public.check_ins enable row level security;
alter table public.tracker_entries enable row level security;
alter table public.journal_entries enable row level security;
alter table public.goals enable row level security;
alter table public.goal_steps enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['check_ins', 'tracker_entries', 'journal_entries', 'goals', 'goal_steps'] loop
    execute format(
      'create policy "Members read their own rows" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "Members add their own rows" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "Members change their own rows" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "Members delete their own rows" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Privacy: export and delete
-- ---------------------------------------------------------------------------------------------

create function public.export_my_data()
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
    'goal_steps', coalesce((select jsonb_agg(s order by s.created_at) from public.goal_steps s), '[]'::jsonb)
  );
$$;

comment on function public.export_my_data is 'Everything stored about the calling member, as JSON. RLS limits every sub-select to their rows.';

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  -- Cascades to profiles and every member-owned table.
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
