-- Onboarding audit.
--  * New sign-ups never got a Players row (nothing created one): a trigger on auth.users now does.
--  * The profile step wrote protected columns (claimed_at) straight from the client and was rejected:
--    it is now complete_profile_onboarding.
--  * "Create a new team" looked a league up by Districts.code, a column that no longer exists (the code
--    moved to DistrictAdminCodes). Players get their own team sign-up code (DistrictJoinCodes) and a
--    lookup function.
--  * create_team_with_address trusted the payload (any captain id, any league, ignored the division) and
--    never created the division request, so a new team sat 'pending' with nobody able to approve it.
--  * Nothing moved a player on from onboarding once a team accepted them: triggers now do.
--  * Rejected / cancelled team requests reset the creator back to the start.
--  * create_district_season_divisions validates its input and reports a taken league name.

-- ── 1. Players row for every new account ────────────────────────────────────
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public."Players" (auth_id, onboarding)
  select new.id, 0
  where not exists (select 1 from public."Players" where auth_id = new.id);
  return new;
end $$;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists trg_handle_new_auth_user on auth.users;
create trigger trg_handle_new_auth_user
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

insert into public."Players" (auth_id, onboarding)
select u.id, 0 from auth.users u
where not exists (select 1 from public."Players" p where p.auth_id = u.id);

-- ── 2. Profile step ─────────────────────────────────────────────────────────
create or replace function public.complete_profile_onboarding(
  p_first_name text, p_surname text, p_nickname text, p_gender text, p_dob date, p_avatar_url text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_me uuid := public.current_player_id(); v_on int;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501', detail = 'not_authorised';
  end if;
  select onboarding into v_on from "Players" where id = v_me for update;
  if coalesce(v_on, 0) <> 0 then return; end if; -- already done

  if length(trim(coalesce(p_first_name, ''))) not between 1 and 50
     or length(trim(coalesce(p_surname, ''))) not between 1 and 50 then
    raise exception 'Enter your first name and surname' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_nickname, ''))) not between 1 and 30 then
    raise exception 'Enter a display name of up to 30 characters' using errcode = 'P0001';
  end if;
  if p_gender is null or p_gender not in ('male', 'female') then
    raise exception 'Select your gender' using errcode = 'P0001';
  end if;
  if p_dob is null or p_dob < date '1900-01-01' or p_dob > (current_date - interval '13 years')::date then
    raise exception 'You must be at least 13 to use the app' using errcode = 'P0001';
  end if;
  if p_avatar_url is not null and p_avatar_url !~ '^https?://' then
    raise exception 'Invalid photo' using errcode = 'P0001';
  end if;

  update "Players"
     set first_name = trim(p_first_name), surname = trim(p_surname), nickname = trim(p_nickname),
         gender = p_gender, dob = p_dob, avatar_url = p_avatar_url,
         onboarding = 1, claimed_at = coalesce(claimed_at, now()), updated_at = now()
   where id = v_me;
end $$;
revoke all on function public.complete_profile_onboarding(text, text, text, text, date, text) from public, anon;
grant execute on function public.complete_profile_onboarding(text, text, text, text, date, text) to authenticated;

-- ── 3. Onboarding follows the player's membership ───────────────────────────
create or replace function public.player_has_pending_onboarding_items(p_player_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
           select 1 from "TeamPlayers"
            where player_id = p_player_id
              and status in ('requested', 'invited', 'pending_captain', 'pending_admin', 'pending_player', 'pending_both'))
      or exists (
           select 1 from "TeamPlayers" tp join "Teams" t on t.id = tp.team_id
            where tp.player_id = p_player_id and tp.status = 'active'
              and t.status = 'pending' and t.parent_team_id is null)
$$;
revoke all on function public.player_has_pending_onboarding_items(uuid) from public, anon, authenticated;

create or replace function public.sync_player_onboarding_from_teamplayers()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' and exists (select 1 from "Teams" where id = new.team_id and status = 'active') then
    update "Players" set onboarding = 9 where id = new.player_id and onboarding in (1, 3);
  elsif new.status not in ('requested', 'invited', 'pending_captain', 'pending_admin', 'pending_player', 'pending_both', 'active') then
    update "Players" set onboarding = 1
     where id = new.player_id and onboarding = 3
       and not public.player_has_pending_onboarding_items(new.player_id);
  end if;
  return new;
end $$;
revoke all on function public.sync_player_onboarding_from_teamplayers() from public, anon, authenticated;

drop trigger if exists trg_sync_player_onboarding_tp on "TeamPlayers";
create trigger trg_sync_player_onboarding_tp
  after insert or update of status on "TeamPlayers"
  for each row execute function public.sync_player_onboarding_from_teamplayers();

create or replace function public.sync_player_onboarding_from_team()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.parent_team_id is not null then return new; end if;
  if new.status = 'active' then
    update "Players" set onboarding = 9
     where onboarding in (1, 3)
       and id in (select player_id from "TeamPlayers" where team_id = new.id and status = 'active');
  elsif new.status = 'cancelled' then
    update "Players" set onboarding = 1
     where onboarding = 3
       and id in (select player_id from "TeamPlayers" where team_id = new.id)
       and not public.player_has_pending_onboarding_items(id);
  end if;
  return new;
end $$;
revoke all on function public.sync_player_onboarding_from_team() from public, anon, authenticated;

drop trigger if exists trg_sync_player_onboarding_team on "Teams";
create trigger trg_sync_player_onboarding_team
  after update of status on "Teams"
  for each row execute function public.sync_player_onboarding_from_team();

-- players who were approved but are still stuck on the waiting screen
update "Players" p set onboarding = 9
 where p.onboarding = 3
   and exists (select 1 from "TeamPlayers" tp join "Teams" t on t.id = tp.team_id
                where tp.player_id = p.id and tp.status = 'active' and t.status = 'active');

create or replace function public.reset_onboarding_choice()
returns void language plpgsql security definer set search_path = public as $$
declare v_me uuid := public.current_player_id();
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501', detail = 'not_authorised';
  end if;
  update "Players" set onboarding = 1
   where id = v_me and onboarding = 3 and not public.player_has_pending_onboarding_items(v_me);
end $$;
revoke all on function public.reset_onboarding_choice() from public, anon;
grant execute on function public.reset_onboarding_choice() to authenticated;

-- joining needs an active team
do $patch$
declare v_def text := pg_get_functiondef('public.request_join_team_onboarding(uuid,uuid,boolean,boolean)'::regprocedure); v_new text;
begin
  v_new := replace(v_def, 'if not found or v_team.parent_team_id is not null then',
                          'if not found or v_team.parent_team_id is not null or v_team.status is distinct from ''active'' then');
  if v_new = v_def then raise exception 'request_join_team_onboarding patch failed'; end if;
  execute v_new;
end
$patch$;

-- ── 4. Team sign-up code for players (separate from the admin code) ─────────
create table if not exists public."DistrictJoinCodes" (
  district_id uuid primary key references public."Districts"(id) on update cascade on delete cascade,
  code        text not null unique check (code ~ '^[0-9]{6}$')
);
alter table public."DistrictJoinCodes" enable row level security;
drop policy if exists "Admins read their team sign-up code" on public."DistrictJoinCodes";
create policy "Admins read their team sign-up code" on public."DistrictJoinCodes"
  for select to authenticated using (public.is_district_admin(district_id));
revoke all on table public."DistrictJoinCodes" from anon, authenticated;
grant select on table public."DistrictJoinCodes" to authenticated;

create or replace function public.gen_league_code()
returns text language plpgsql security definer set search_path = public as $$
declare v_code text; i int := 0;
begin
  loop
    v_code := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    exit when not exists (select 1 from "DistrictJoinCodes" where code = v_code)
          and not exists (select 1 from "DistrictAdminCodes" where code = v_code);
    i := i + 1;
    if i > 50 then raise exception 'Could not generate a code'; end if;
  end loop;
  return v_code;
end $$;
revoke all on function public.gen_league_code() from public, anon, authenticated;

insert into public."DistrictJoinCodes" (district_id, code)
select d.id, public.gen_league_code() from public."Districts" d
where d.status = 'active' and not exists (select 1 from public."DistrictJoinCodes" j where j.district_id = d.id);

create or replace function public.set_team_signup_code(p_district_id uuid, p_code text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_district_admin(p_district_id) then
    raise exception 'Only a league admin can change this' using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_code is null or p_code !~ '^[0-9]{6}$' then
    raise exception 'The code must be 6 digits' using errcode = 'P0001', detail = 'invalid_code';
  end if;
  if exists (select 1 from "DistrictAdminCodes" where code = p_code) then
    raise exception 'That code is already in use' using errcode = 'P0001', detail = 'code_taken';
  end if;
  insert into "DistrictJoinCodes" (district_id, code) values (p_district_id, p_code)
  on conflict (district_id) do update set code = excluded.code;
  return p_code;
exception when unique_violation then
  raise exception 'That code is already in use' using errcode = 'P0001', detail = 'code_taken';
end $$;
revoke all on function public.set_team_signup_code(uuid, text) from public, anon;
grant execute on function public.set_team_signup_code(uuid, text) to authenticated;

create or replace function public.find_league_by_code(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_d "Districts"%rowtype;
begin
  if public.current_player_id() is null then
    raise exception 'Not signed in' using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_code is null or p_code !~ '^[0-9]{6}$' then
    raise exception 'The code must be 6 digits' using errcode = 'P0001', detail = 'invalid_code';
  end if;
  select d.* into v_d from "Districts" d join "DistrictJoinCodes" j on j.district_id = d.id
   where j.code = p_code and d.status = 'active';
  if not found then
    raise exception 'No league uses that code' using errcode = 'P0002', detail = 'league_not_found';
  end if;
  return jsonb_build_object(
    'id', v_d.id, 'name', v_d.name,
    'Divisions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', dv.id, 'name', dv.name, 'group_id', dv.group_id, 'group_name', dv.group_name, 'tier', dv.tier,
               'competitor_type', dv.competitor_type, 'max_competitors', dv.max_competitors,
               'admin_approval_required', dv.admin_approval_required,
               'member_count', (select count(*) from "DivisionMembers" m where m.division_id = dv.id and m.status = 'active' and m.member_type = 'team'))
             order by dv.group_id, dv.tier)
        from "Divisions" dv where dv.district = v_d.id and dv.competitor_type = 'team'), '[]'::jsonb));
end $$;
revoke all on function public.find_league_by_code(text) from public, anon;
grant execute on function public.find_league_by_code(text) to authenticated;

-- join an existing team by its code
create or replace function public.find_team_by_code(p_code text)
returns "Teams" language plpgsql stable security definer set search_path = public as $$
declare v_t "Teams";
begin
  if public.current_player_id() is null then
    raise exception 'Not signed in' using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_code is null or p_code !~ '^[0-9]{6}$' then
    raise exception 'The code must be 6 digits' using errcode = 'P0001', detail = 'invalid_code';
  end if;
  select * into v_t from "Teams" where code = p_code and parent_team_id is null and status = 'active';
  if not found then
    raise exception 'No team uses that code' using errcode = 'P0002', detail = 'team_not_found';
  end if;
  return v_t;
end $$;
revoke all on function public.find_team_by_code(text) from public, anon;
grant execute on function public.find_team_by_code(text) to authenticated;

-- ── 5. Creating a team ──────────────────────────────────────────────────────
create or replace function public.create_team_with_address(payload jsonb)
returns "Teams" language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.current_player_id();
  v_district uuid := nullif(payload->>'_district', '')::uuid;
  v_division uuid := nullif(payload->>'_division', '')::uuid;
  v_name text := trim(coalesce(payload->>'_name', ''));
  v_display text := trim(coalesce(payload->>'_display_name', ''));
  v_abbr text := upper(trim(coalesce(payload->>'_abbreviation', '')));
  v_tables smallint := nullif(payload->>'_tables', '')::smallint;
  v_line1 text := nullif(trim(coalesce(payload->>'_line1', '')), '');
  v_city text := nullif(trim(coalesce(payload->>'_city', '')), '');
  v_post text := nullif(trim(coalesce(payload->>'_post_code', '')), '');
  v_div "Divisions"%rowtype; v_addr "Addresses"; v_team "Teams"; v_code text; v_c text; v_i int := 0;
begin
  if v_me is null then
    raise exception 'Not signed in' using errcode = '42501', detail = 'not_authorised';
  end if;
  if not exists (select 1 from "Districts" where id = v_district and status = 'active') then
    raise exception 'LEAGUE_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_division is null then
    raise exception 'DIVISION_REQUIRED' using errcode = 'P0001';
  end if;
  select * into v_div from "Divisions" where id = v_division and district = v_district and competitor_type = 'team';
  if not found then
    raise exception 'DIVISION_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_div.max_competitors is not null and
     (select count(*) from "DivisionMembers" where division_id = v_division and status = 'active' and member_type = 'team') >= v_div.max_competitors then
    raise exception 'DIVISION_FULL' using errcode = 'P0001';
  end if;

  if length(v_name) not between 3 and 60 or length(v_display) not between 2 and 40 or v_abbr !~ '^[A-Z0-9]{3}$' then
    raise exception 'INVALID_TEAM_DETAILS' using errcode = 'P0001';
  end if;
  if v_line1 is null or v_city is null or v_post is null or v_tables is null or v_tables < 1 then
    raise exception 'INVALID_ADDRESS' using errcode = 'P0001';
  end if;

  if exists (select 1 from "TeamPlayers" tp join "Teams" t on t.id = tp.team_id
              where tp.player_id = v_me and tp.role = 'captain' and tp.status = 'active'
                and t.status = 'pending' and t.parent_team_id is null) then
    raise exception 'ALREADY_PENDING' using errcode = 'P0001';
  end if;
  if exists (select 1 from "TeamPlayers" tp join "Teams" t on t.id = tp.team_id
              where tp.player_id = v_me and tp.status in ('active', 'requested', 'pending_captain', 'pending_admin', 'pending_both')
                and t.district = v_district and t.parent_team_id is null and t.status <> 'cancelled') then
    raise exception 'ALREADY_IN_DISTRICT' using errcode = 'P0001';
  end if;

  loop
    v_code := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    exit when not exists (select 1 from "Teams" where code = v_code);
    v_i := v_i + 1;
    if v_i > 50 then raise exception 'Could not generate a team code'; end if;
  end loop;

  insert into "Addresses" (name, line_1, line_2, city, county, postcode, tables, district_id)
  values (nullif(trim(coalesce(payload->>'_venue_name', '')), ''), v_line1,
          nullif(trim(coalesce(payload->>'_line2', '')), ''), v_city,
          nullif(trim(coalesce(payload->>'_county', '')), ''), v_post, v_tables, v_district)
  returning * into v_addr;

  insert into "Teams" (name, display_name, abbreviation, crest, division, district, status, private, address, cover_image_url, code)
  values (v_name, v_display, v_abbr, payload->'_crest', null, v_district, 'pending',
          coalesce((payload->>'_is_private')::boolean, true), v_addr.id,
          nullif(payload->>'_cover_image_url', ''), v_code)
  returning * into v_team;

  insert into "TeamPlayers" (team_id, player_id, role, status, joined_at)
  values (v_team.id, v_me, 'captain', 'active', now());

  insert into "DivisionMembers" (team_id, division_id, status, member_type, requested_by, requested_at)
  values (v_team.id, v_division, 'pending_admin', 'team', v_me, now());

  update "Players" set onboarding = 3 where id = v_me and onboarding in (1, 3);

  select * into v_team from "Teams" where id = v_team.id;
  return v_team;
exception when unique_violation then
  get stacked diagnostics v_c = constraint_name;
  if v_c = 'teams_main_name_key' then raise exception 'TEAM_NAME_TAKEN' using errcode = 'P0001'; end if;
  if v_c = 'teams_main_display_name_key' then raise exception 'TEAM_DISPLAY_NAME_TAKEN' using errcode = 'P0001'; end if;
  if v_c = 'Teams_abbreviation_key' then raise exception 'TEAM_ABBREVIATION_TAKEN' using errcode = 'P0001'; end if;
  raise;
end $$;
revoke all on function public.create_team_with_address(jsonb) from public, anon;
grant execute on function public.create_team_with_address(jsonb) to authenticated;

-- what a team creator is waiting on
create or replace function public.my_pending_team_creations()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := public.current_player_id();
begin
  if v_me is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'team_id', t.id, 'display_name', t.display_name, 'crest', t.crest,
             'division_name', dv.name, 'league_name', d.name, 'requested_at', dm.requested_at))
      from "TeamPlayers" tp
      join "Teams" t on t.id = tp.team_id and t.status = 'pending' and t.parent_team_id is null
      join "DivisionMembers" dm on dm.team_id = t.id and dm.status = 'pending_admin'
      join "Divisions" dv on dv.id = dm.division_id
      left join "Districts" d on d.id = dv.district
     where tp.player_id = v_me and tp.role = 'captain' and tp.status = 'active'), '[]'::jsonb);
end $$;
revoke all on function public.my_pending_team_creations() from public, anon;
grant execute on function public.my_pending_team_creations() to authenticated;

create or replace function public.cancel_team_creation(p_team_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid := public.current_player_id();
begin
  if v_me is null or not exists (
       select 1 from "TeamPlayers" tp join "Teams" t on t.id = tp.team_id
        where tp.team_id = p_team_id and tp.player_id = v_me and tp.role = 'captain'
          and tp.status = 'active' and t.status = 'pending' and t.parent_team_id is null) then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'No pending team request found');
  end if;
  update "DivisionMembers" set status = 'cancelled' where team_id = p_team_id and status = 'pending_admin';
  update "TeamPlayers" set status = 'left', left_at = now() where team_id = p_team_id and status = 'active';
  update "Teams" set status = 'cancelled', updated_at = now() where id = p_team_id;
  return jsonb_build_object('success', true);
end $$;
revoke all on function public.cancel_team_creation(uuid) from public, anon;
grant execute on function public.cancel_team_creation(uuid) to authenticated;

-- a rejected new team is cancelled, which sends its creator back to the start
do $patch$
declare v_def text := pg_get_functiondef('public.handle_join_division_request(uuid,text,uuid)'::regprocedure); v_new text;
begin
  v_new := replace(v_def,
    E'update "DivisionMembers" set status = ''rejected'', accepted_by = v_me, accepted_at = now()\n     where id = p_request_id;',
    E'update "DivisionMembers" set status = ''rejected'', accepted_by = v_me, accepted_at = now()\n     where id = p_request_id;\n    if v_dm.team_id is not null then\n      update "TeamPlayers" set status = ''left'', left_at = now()\n       where team_id = v_dm.team_id and status = ''active''\n         and exists (select 1 from "Teams" where id = v_dm.team_id and status = ''pending'' and parent_team_id is null);\n      update "Teams" set status = ''cancelled'', updated_at = now() where id = v_dm.team_id and status = ''pending'' and parent_team_id is null;\n    end if;');
  if v_new = v_def then raise exception 'handle_join_division_request patch failed'; end if;
  execute v_new;
end
$patch$;

-- ── 6. Creating a league ────────────────────────────────────────────────────
create or replace function public.create_district_season_divisions(
  _district_id uuid, _district_name text, _is_private boolean, _season_name text, _start_date date,
  _season_status text, _divisions jsonb, _admin_id uuid, _tie_break_rules text[] default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_season_id uuid; v_division jsonb; v_names text[] := '{}'; v_name text;
begin
  if _admin_id is distinct from public.current_player_id() or not exists (
       select 1 from "Districts" where id = _district_id and status = 'locked' and locked_by = _admin_id) then
    raise exception 'You are not setting this league up' using errcode = '42501', detail = 'not_authorised';
  end if;

  if length(trim(coalesce(_district_name, ''))) not between 3 and 60 then
    raise exception 'The league name must be between 3 and 60 characters' using errcode = 'P0001', detail = 'invalid_name';
  end if;
  if length(trim(coalesce(_season_name, ''))) not between 1 and 60 then
    raise exception 'Enter a season name' using errcode = 'P0001', detail = 'invalid_season';
  end if;
  if _start_date is null then
    raise exception 'Choose a season start date' using errcode = 'P0001', detail = 'invalid_season';
  end if;
  if _season_status not in ('active', 'draft') then
    raise exception 'Invalid season status' using errcode = 'P0001', detail = 'invalid_season';
  end if;
  if _divisions is null or jsonb_typeof(_divisions) <> 'array' or jsonb_array_length(_divisions) = 0 then
    raise exception 'Add at least one division' using errcode = 'P0001', detail = 'no_divisions';
  end if;

  update "Districts"
     set name = trim(_district_name), private = coalesce(_is_private, false), active = true, initiated_at = now(),
         status = 'active', locked_at = null, locked_by = null, lock_expires_at = null,
         tie_break_rules = public.clean_tie_break_rules(_tie_break_rules)
   where id = _district_id;

  for v_division in select * from jsonb_array_elements(_divisions) loop
    v_name := lower(trim(coalesce(v_division->>'name', '')));
    if v_name = '' or length(v_name) > 60 then
      raise exception 'Every division needs a name' using errcode = 'P0001', detail = 'invalid_division';
    end if;
    if v_name = any(v_names) then
      raise exception 'Division names must be unique' using errcode = 'P0001', detail = 'invalid_division';
    end if;
    v_names := v_names || v_name;
    if coalesce((v_division->>'tier')::int, 0) < 1
       or coalesce((v_division->>'promotionSpots')::int, 0) < 0
       or coalesce((v_division->>'relegationSpots')::int, 0) < 0
       or (v_division->>'maxCompetitors' is not null and (v_division->>'maxCompetitors')::int < 2) then
      raise exception 'Invalid division settings' using errcode = 'P0001', detail = 'invalid_division';
    end if;

    insert into "Divisions" (district, name, group_id, group_name, tier, promotion_spots, relegation_spots, competitor_type, max_competitors)
    values (_district_id, trim(v_division->>'name'), (v_division->>'groupId')::int, v_division->>'groupName',
            (v_division->>'tier')::int, coalesce((v_division->>'promotionSpots')::int, 0),
            coalesce((v_division->>'relegationSpots')::int, 0), (v_division->>'competitorType')::competitor_type,
            (v_division->>'maxCompetitors')::int);
  end loop;

  insert into "Seasons" (district, name, start_date, status)
  values (_district_id, trim(_season_name), _start_date, _season_status)
  returning id into v_season_id;

  insert into "DistrictAdmins" (district_id, user_id, role) values (_district_id, _admin_id, 'owner')
  on conflict (user_id, district_id) do nothing;

  insert into "DistrictJoinCodes" (district_id, code) values (_district_id, public.gen_league_code())
  on conflict (district_id) do nothing;

  update "Players" set onboarding = 9 where id = _admin_id;

  return v_season_id;
exception when unique_violation then
  if sqlerrm like '%Districts_name_key%' then
    raise exception 'A league with that name already exists' using errcode = 'P0001', detail = 'district_name_taken';
  end if;
  raise;
end $$;
revoke all on function public.create_district_season_divisions(uuid, text, boolean, text, date, text, jsonb, uuid, text[]) from public, anon;
grant execute on function public.create_district_season_divisions(uuid, text, boolean, text, date, text, jsonb, uuid, text[]) to authenticated;
