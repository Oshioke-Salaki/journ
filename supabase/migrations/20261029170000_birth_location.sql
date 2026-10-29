-- Where a member was born, as a real place: needed for accurate astrology and Human Design charts.
alter table public.profiles
  add column birth_latitude numeric(8, 5) check (birth_latitude between -90 and 90),
  add column birth_longitude numeric(8, 5) check (birth_longitude between -180 and 180),
  add column birth_timezone text check (char_length(birth_timezone) <= 64),
  add column birth_country text check (birth_country ~ '^[A-Z]{2}$');

comment on column public.profiles.birth_latitude is 'From the place search. Used for astrology features (planned).';

grant update (birth_latitude, birth_longitude, birth_timezone, birth_country) on public.profiles to authenticated;
