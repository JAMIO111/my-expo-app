-- Districts and DistrictAdmins were writable by any signed-in user, and every
-- district's admin join code was readable by everyone, so anyone could make
-- themselves an admin of any league (and admin rights now unlock fixture and
-- result management too).
--
-- After this migration:
--   * Nobody writes Districts / DistrictAdmins directly. All changes go through
--     the checked functions below.
--   * The admin join code lives in DistrictAdminCodes, readable only by that
--     district's admins (Districts.code is dropped).
--   * A player can become a district admin in two ways:
--       1. entering the district's admin code (claim_district_by_code): a brand
--          new district is locked for the claimer to set up; an active district
--          adds them as an admin;
--       2. an invite from an existing admin (invite_district_admin ->
--          accept_district_admin_invite).
--   * Settings are changed by admins only (update_district_settings,
--     set_district_join_code); onboarding writes go through
--     update_district_onboarding and create_district_season_divisions, which
--     require the caller to hold the district's setup lock.

-- ── Admin join codes move to their own admin-only table ──────────────────────

create table if not exists public."DistrictAdminCodes" (
  district_id uuid primary key references public."Districts"(id) on update cascade on delete cascade,
  code        text not null unique check (code ~ '^[0-9]{6}$')
);

insert into public."DistrictAdminCodes" (district_id, code)
select id, code from public."Districts"
where code is not null and code ~ '^[0-9]{6}$'
on conflict do nothing;

alter table public."DistrictAdminCodes" enable row level security;
drop policy if exists "Admins read their district code" on public."DistrictAdminCodes";
create policy "Admins read their district code" on public."DistrictAdminCodes"
  for select to authenticated
  using (public.is_district_admin(district_id));

revoke all on table public."DistrictAdminCodes" from anon, authenticated;
grant select on table public."DistrictAdminCodes" to authenticated;

alter table public."Districts" drop column if exists code;

-- ── No direct writes ─────────────────────────────────────────────────────────

drop policy if exists "Authenticated write access" on public."Districts";
drop policy if exists "Authenticated write access" on public."DistrictAdmins";
revoke insert, update, delete, truncate on public."Districts" from anon, authenticated;
revoke insert, update, delete, truncate on public."DistrictAdmins" from anon, authenticated;

create unique index if not exists "DistrictAdmins_user_district_key"
  on public."DistrictAdmins" (user_id, district_id);

-- ── Admin invites ────────────────────────────────────────────────────────────

create table if not exists public."DistrictAdminInvites" (
  id                uuid primary key default gen_random_uuid(),
  district_id       uuid not null references public."Districts"(id) on update cascade on delete cascade,
  invited_player_id uuid not null references public."Players"(id) on update cascade on delete cascade,
  invited_by        uuid references public."Players"(id) on update cascade on delete set null,
  status            text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at        timestamptz not null default now(),
  responded_at      timestamptz
);

create unique index if not exists "DistrictAdminInvites_one_pending"
  on public."DistrictAdminInvites" (district_id, invited_player_id) where status = 'pending';

alter table public."DistrictAdminInvites" enable row level security;
drop policy if exists "Invitee and admins read invites" on public."DistrictAdminInvites";
create policy "Invitee and admins read invites" on public."DistrictAdminInvites"
  for select to authenticated
  using (invited_player_id = public.current_player_id() or public.is_district_admin(district_id));

revoke all on table public."DistrictAdminInvites" from anon, authenticated;
grant select on table public."DistrictAdminInvites" to authenticated;

insert into public."NotificationTypeCategories" (type, category) values
  ('admin_invite', 'league'),
  ('admin_invite_response', 'league')
on conflict (type) do nothing;

-- ── Joining with the admin code ──────────────────────────────────────────────

create or replace function public.claim_district_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_me uuid := public.current_player_id();
  v_d  "Districts"%rowtype;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_code is null or p_code !~ '^[0-9]{6}$' then
    raise exception 'The code must be 6 digits' using errcode = 'P0001', detail = 'invalid_code';
  end if;

  select d.* into v_d
  from "Districts" d
  join "DistrictAdminCodes" c on c.district_id = d.id
  where c.code = p_code
  for update of d;
  if not found then
    raise exception 'No league uses that code' using errcode = 'P0002', detail = 'league_not_found';
  end if;

  if v_d.status = 'new'
     or (v_d.status = 'locked' and (v_d.locked_by = v_me or v_d.lock_expires_at is null or v_d.lock_expires_at < now())) then
    -- a new league: lock it so this player can set it up (10 minute lock, refreshed on re-entry)
    update "Districts"
    set status = 'locked', locked_by = v_me, locked_at = now(),
        lock_expires_at = now() + interval '10 minutes'
    where id = v_d.id;
    return jsonb_build_object('status', 'lock_acquired', 'district_id', v_d.id, 'district_name', v_d.name);
  elsif v_d.status = 'locked' then
    raise exception 'Someone else is setting this league up' using errcode = 'P0001', detail = 'league_locked';
  elsif v_d.status = 'active' then
    insert into "DistrictAdmins" (district_id, user_id, role)
    values (v_d.id, v_me, 'admin')
    on conflict (user_id, district_id) do nothing;
    update "Players" set onboarding = 9 where id = v_me;
    update "DistrictAdminInvites"
    set status = 'accepted', responded_at = now()
    where district_id = v_d.id and invited_player_id = v_me and status = 'pending';
    return jsonb_build_object('status', 'joined', 'district_id', v_d.id, 'district_name', v_d.name);
  end if;

  raise exception 'No league uses that code' using errcode = 'P0002', detail = 'league_not_found';
end;
$function$;

-- Onboarding step: name / privacy of the district being set up (holder of the lock only).
create or replace function public.update_district_onboarding(
  p_district_id uuid,
  p_name text,
  p_private boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_me uuid := public.current_player_id();
begin
  if v_me is null or not exists (
    select 1 from "Districts" where id = p_district_id and status = 'locked' and locked_by = v_me
  ) then
    raise exception 'You are not setting this league up' using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_name is null or length(trim(p_name)) < 3 then
    raise exception 'The league name must be at least 3 characters' using errcode = 'P0001', detail = 'invalid_name';
  end if;

  update "Districts"
  set name = trim(p_name), private = coalesce(p_private, private),
      initiated_at = now(), active = true
  where id = p_district_id;
exception when unique_violation then
  raise exception 'A league with that name already exists' using errcode = 'P0001', detail = 'district_name_taken';
end;
$function$;

-- ── Admin-only settings ──────────────────────────────────────────────────────

create or replace function public.update_district_settings(
  p_district_id uuid,
  p_name text default null,
  p_private boolean default null,
  p_transfer_approval_required boolean default null,
  p_transfer_window_open boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_d "Districts"%rowtype;
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Only a league admin can change league settings' using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_name is not null and length(trim(p_name)) < 3 then
    raise exception 'The league name must be at least 3 characters' using errcode = 'P0001', detail = 'invalid_name';
  end if;

  select * into v_d from "Districts" where id = p_district_id for update;

  update "Districts"
  set name = coalesce(trim(p_name), name),
      private = coalesce(p_private, private),
      transfer_approval_required = coalesce(p_transfer_approval_required, transfer_approval_required),
      transfer_window_open = coalesce(p_transfer_window_open, transfer_window_open),
      transfer_window_last_updated = case
        when p_transfer_window_open is not null and p_transfer_window_open is distinct from v_d.transfer_window_open
          then now() else transfer_window_last_updated end
  where id = p_district_id
  returning * into v_d;

  return to_jsonb(v_d);
exception when unique_violation then
  raise exception 'A league with that name already exists' using errcode = 'P0001', detail = 'district_name_taken';
end;
$function$;

create or replace function public.set_district_join_code(p_district_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Only a league admin can change the code' using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_code is null or p_code !~ '^[0-9]{6}$' then
    raise exception 'The code must be 6 digits' using errcode = 'P0001', detail = 'invalid_code';
  end if;

  insert into "DistrictAdminCodes" (district_id, code) values (p_district_id, p_code)
  on conflict (district_id) do update set code = excluded.code;
exception when unique_violation then
  raise exception 'That code is already in use' using errcode = 'P0001', detail = 'code_taken';
end;
$function$;

-- ── Invites from an existing admin ───────────────────────────────────────────

create or replace function public.invite_district_admin(p_district_id uuid, p_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_me       uuid := public.current_player_id();
  v_invite   "DistrictAdminInvites"%rowtype;
  v_inviter  text;
  v_district text;
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Only a league admin can invite admins' using errcode = '42501', detail = 'not_authorised';
  end if;
  if not exists (select 1 from "Players" where id = p_player_id and coalesce(is_deleted, false) = false) then
    raise exception 'That player does not exist' using errcode = 'P0002', detail = 'player_not_found';
  end if;
  if exists (select 1 from "DistrictAdmins" where district_id = p_district_id and user_id = p_player_id) then
    raise exception 'That player is already an admin' using errcode = 'P0001', detail = 'already_admin';
  end if;

  begin
    insert into "DistrictAdminInvites" (district_id, invited_player_id, invited_by)
    values (p_district_id, p_player_id, v_me)
    returning * into v_invite;
  exception when unique_violation then
    raise exception 'That player already has a pending invite' using errcode = 'P0001', detail = 'already_invited';
  end;

  select first_name || ' ' || surname into v_inviter from "Players" where id = v_me;
  select name into v_district from "Districts" where id = p_district_id;

  insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
  values (
    p_player_id, 'admin_invite', 'League admin invitation',
    format('%s invited you to be an admin of %s.', v_inviter, v_district),
    v_invite.id, 'district_admin_invite',
    jsonb_build_object('link', '/settings/DistrictAdminInvites', 'inviteId', v_invite.id, 'districtId', p_district_id)
  );

  return to_jsonb(v_invite);
end;
$function$;

create or replace function public.accept_district_admin_invite(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_me     uuid := public.current_player_id();
  v_invite "DistrictAdminInvites"%rowtype;
  v_name   text;
  v_dname  text;
begin
  select * into v_invite from "DistrictAdminInvites" where id = p_invite_id for update;
  if not found then
    raise exception 'Invite not found' using errcode = 'P0002', detail = 'invite_not_found';
  end if;
  if v_me is null or v_invite.invited_player_id <> v_me then
    raise exception 'This invite is not for you' using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'This invite is no longer open' using errcode = 'P0001', detail = 'invite_closed';
  end if;

  insert into "DistrictAdmins" (district_id, user_id, role)
  values (v_invite.district_id, v_me, 'admin')
  on conflict (user_id, district_id) do nothing;

  update "DistrictAdminInvites" set status = 'accepted', responded_at = now() where id = p_invite_id;

  select first_name || ' ' || surname into v_name from "Players" where id = v_me;
  select name into v_dname from "Districts" where id = v_invite.district_id;
  if v_invite.invited_by is not null then
    insert into "Notifications" (player_id, type, title, message, reference_id, reference_type, data)
    values (v_invite.invited_by, 'admin_invite_response', 'Admin invitation accepted',
            format('%s is now an admin of %s.', v_name, v_dname),
            p_invite_id, 'district_admin_invite', jsonb_build_object('districtId', v_invite.district_id));
  end if;

  return jsonb_build_object('district_id', v_invite.district_id, 'district_name', v_dname);
end;
$function$;

create or replace function public.decline_district_admin_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_me     uuid := public.current_player_id();
  v_invite "DistrictAdminInvites"%rowtype;
begin
  select * into v_invite from "DistrictAdminInvites" where id = p_invite_id for update;
  if not found then
    raise exception 'Invite not found' using errcode = 'P0002', detail = 'invite_not_found';
  end if;
  if v_me is null or v_invite.invited_player_id <> v_me then
    raise exception 'This invite is not for you' using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'This invite is no longer open' using errcode = 'P0001', detail = 'invite_closed';
  end if;
  update "DistrictAdminInvites" set status = 'declined', responded_at = now() where id = p_invite_id;
end;
$function$;

create or replace function public.revoke_district_admin_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_invite "DistrictAdminInvites"%rowtype;
begin
  select * into v_invite from "DistrictAdminInvites" where id = p_invite_id for update;
  if not found then
    raise exception 'Invite not found' using errcode = 'P0002', detail = 'invite_not_found';
  end if;
  if not public.is_district_admin(v_invite.district_id) then
    raise exception 'Only a league admin can withdraw an invite' using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'This invite is no longer open' using errcode = 'P0001', detail = 'invite_closed';
  end if;
  update "DistrictAdminInvites" set status = 'revoked', responded_at = now() where id = p_invite_id;
  delete from "Notifications" where reference_id = p_invite_id and type = 'admin_invite';
end;
$function$;

create or replace function public.get_my_district_admin_invites()
returns jsonb
language sql
stable
security definer
set search_path = public
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'created_at', i.created_at,
    'district', jsonb_build_object('id', d.id, 'name', d.name),
    'invited_by', (select p.first_name || ' ' || p.surname from "Players" p where p.id = i.invited_by)
  ) order by i.created_at desc), '[]'::jsonb)
  from "DistrictAdminInvites" i
  join "Districts" d on d.id = i.district_id
  where i.invited_player_id = public.current_player_id() and i.status = 'pending';
$function$;

create or replace function public.get_district_admin_invites(p_district_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Not authorised' using errcode = '42501', detail = 'not_authorised';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', i.id,
      'created_at', i.created_at,
      'player', jsonb_build_object('id', p.id, 'first_name', p.first_name, 'surname', p.surname, 'nickname', p.nickname, 'avatar_url', p.avatar_url)
    ) order by i.created_at desc)
    from "DistrictAdminInvites" i
    join "Players" p on p.id = i.invited_player_id
    where i.district_id = p_district_id and i.status = 'pending'
  ), '[]'::jsonb);
end;
$function$;

-- ── Patch existing functions ─────────────────────────────────────────────────

do $patch$
declare
  v_def text;
  v_new text;
begin
  -- get_user_context: the district JSON no longer has a code column; admins get it
  -- from DistrictAdminCodes (row-level security returns it only to that district's admins).
  v_def := pg_get_functiondef('public.get_user_context(uuid)'::regprocedure);
  v_new := replace(v_def, '''district'', to_jsonb(dist)',
    '''district'', to_jsonb(dist) || jsonb_build_object(''code'', (select c.code from "DistrictAdminCodes" c where c.district_id = dist.id))');
  if v_new = v_def then raise exception 'get_user_context patch changed nothing'; end if;
  execute v_new;

  -- create_district_season_divisions: only the player holding the district's setup lock,
  -- and only for themselves; runs as definer since the tables are no longer client-writable.
  v_def := pg_get_functiondef('public.create_district_season_divisions(uuid,text,boolean,text,date,text,jsonb,uuid)'::regprocedure);
  v_new := regexp_replace(v_def, 'LANGUAGE plpgsql\s+AS', E'LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''public''\nAS');
  v_new := regexp_replace(v_new, 'begin\s',
    E'begin\n    if _admin_id is distinct from public.current_player_id() or not exists (\n        select 1 from "Districts" where id = _district_id and status = ''locked'' and locked_by = _admin_id\n    ) then\n        raise exception ''You are not setting this league up'' using errcode = ''42501'', detail = ''not_authorised'';\n    end if;\n\n');
  if v_new = v_def or v_new not like '%SECURITY DEFINER%' or v_new not like '%not setting this league up%' then
    raise exception 'create_district_season_divisions patch did not apply';
  end if;
  execute v_new;
end
$patch$;

-- The old unchecked way of becoming an admin.
revoke all on function public.join_district_as_admin(uuid, uuid) from public, anon, authenticated;
comment on function public.join_district_as_admin(uuid, uuid) is 'DEPRECATED and disabled: use claim_district_by_code or an admin invite.';

-- ── Privileges ───────────────────────────────────────────────────────────────

revoke all on function public.claim_district_by_code(text) from public, anon;
revoke all on function public.update_district_onboarding(uuid, text, boolean) from public, anon;
revoke all on function public.update_district_settings(uuid, text, boolean, boolean, boolean) from public, anon;
revoke all on function public.set_district_join_code(uuid, text) from public, anon;
revoke all on function public.invite_district_admin(uuid, uuid) from public, anon;
revoke all on function public.accept_district_admin_invite(uuid) from public, anon;
revoke all on function public.decline_district_admin_invite(uuid) from public, anon;
revoke all on function public.revoke_district_admin_invite(uuid) from public, anon;
revoke all on function public.get_my_district_admin_invites() from public, anon;
revoke all on function public.get_district_admin_invites(uuid) from public, anon;
revoke all on function public.create_district_season_divisions(uuid, text, boolean, text, date, text, jsonb, uuid) from public, anon;
grant execute on function public.claim_district_by_code(text) to authenticated;
grant execute on function public.update_district_onboarding(uuid, text, boolean) to authenticated;
grant execute on function public.update_district_settings(uuid, text, boolean, boolean, boolean) to authenticated;
grant execute on function public.set_district_join_code(uuid, text) to authenticated;
grant execute on function public.invite_district_admin(uuid, uuid) to authenticated;
grant execute on function public.accept_district_admin_invite(uuid) to authenticated;
grant execute on function public.decline_district_admin_invite(uuid) to authenticated;
grant execute on function public.revoke_district_admin_invite(uuid) to authenticated;
grant execute on function public.get_my_district_admin_invites() to authenticated;
grant execute on function public.get_district_admin_invites(uuid) to authenticated;
grant execute on function public.create_district_season_divisions(uuid, text, boolean, text, date, text, jsonb, uuid) to authenticated;
