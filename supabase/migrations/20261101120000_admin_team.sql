-- Admins manage the admin team from the app. Only admins can call these; an admin cannot remove
-- themselves, and the last admin can never be removed.

create function public.admin_list_admins()
returns table (id uuid, email text, display_name text, created_at timestamptz)
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
    select u.id, u.email::text, p.display_name, u.created_at
    from auth.users u join public.profiles p on p.id = u.id
    where p.role = 'admin'
    order by u.created_at;
end;
$$;

create function public.admin_set_role(target_email text, make_admin boolean)
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
  if not make_admin and target = (select auth.uid()) then
    return 'self';
  end if;
  if not make_admin and (select count(*) from public.profiles where role = 'admin') <= 1 then
    return 'last_admin';
  end if;
  update public.profiles set role = case when make_admin then 'admin'::public.member_role else 'member'::public.member_role end where id = target;
  return 'ok';
end;
$$;

revoke execute on function public.admin_list_admins() from public, anon;
revoke execute on function public.admin_set_role(text, boolean) from public, anon;
grant execute on function public.admin_list_admins() to authenticated;
grant execute on function public.admin_set_role(text, boolean) to authenticated;
