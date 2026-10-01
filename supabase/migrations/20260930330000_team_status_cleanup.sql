-- Teams.status had two "pending" values from two features:
--   'pending'          squads (child teams) still waiting for invited players to accept
--   'pending_approval' main teams waiting for a league admin to approve them into a division
-- (and NULL on most older main teams). One value now: 'pending'. Values: pending | active |
-- archived | disbanded. Whether a main team may take transfers is decided by whether it is in a
-- division, not by this column.

-- new main teams start as 'pending'
do $patch$
declare v_def text := pg_get_functiondef('public.create_team_with_address(jsonb)'::regprocedure); v_new text;
begin
  v_new := replace(v_def, '''pending_approval''', '''pending''');
  if v_new = v_def then raise exception 'create_team_with_address patch did not apply'; end if;
  execute v_new;
end
$patch$;

-- tidy existing data
update "Teams"
   set status = case when public.team_division_id(id) is not null then 'active' else 'pending' end
 where status = 'pending_approval';
update "Teams" set status = 'active' where status is null;

alter table "Teams" alter column status set default 'active';
alter table "Teams" alter column status set not null;
alter table "Teams" add constraint teams_status_check check (status in ('pending', 'active', 'archived', 'disbanded'));

-- transfers: a team that is not in a division yet, or is archived / disbanded, cannot take players
create or replace function public.transfer_block_reason(p_team_id uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare v_district uuid; v_window boolean; v_div uuid; v_mid boolean; v_status text;
begin
  select district, status into v_district, v_status from "Teams" where id = p_team_id;
  if v_district is null then return 'team_not_found'; end if;

  v_div := public.team_division_id(p_team_id);
  if v_div is null or v_status = 'pending' then return 'team_not_approved'; end if;
  if v_status in ('archived', 'disbanded') then return 'team_inactive'; end if;

  select transfer_window_open into v_window from "Districts" where id = v_district;
  if v_window is not true then return 'window_closed'; end if;

  select mid_season_transfers into v_mid from "Divisions" where id = v_div;
  if v_mid is not true
     and exists (select 1 from "Seasons" where district = v_district and status = 'active') then
    return 'mid_season_transfers_off';
  end if;
  return null;
end $$;

create or replace function public.transfer_block_response(p_team_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case
    when r is null then null
    else jsonb_build_object(
      'success', false, 'code', r, 'title', 'Transfers unavailable',
      'message', case r
        when 'window_closed' then 'The transfer window is currently closed for this league.'
        when 'mid_season_transfers_off' then 'Mid-season transfers are not allowed in this division. Transfers reopen when the season ends.'
        when 'team_not_approved' then 'This team is still awaiting league approval.'
        when 'team_inactive' then 'This team is no longer active.'
        else 'This team cannot accept transfers right now.' end)
  end
  from (select public.transfer_block_reason(p_team_id) as r) x
$$;
