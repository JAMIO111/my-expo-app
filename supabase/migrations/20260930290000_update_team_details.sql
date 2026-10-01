-- log_and_update_changes took a table name and a column map from the client and ran as the
-- caller, i.e. it only worked while every table was writable by anyone. With the write
-- policies removed it fails, and it must not come back: team edits now go through a function
-- that checks who is asking, validates the values and records the change in TeamsHistory.

create or replace function public.update_team_details(
  p_team_id uuid,
  p_name text default null,
  p_display_name text default null,
  p_abbreviation text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_team "Teams"%rowtype;
  v_name text; v_display text; v_abbr text;
  v_now timestamptz := now();
  v_changes jsonb := '{}'::jsonb;
  v_col text; v_old text; v_new text;
begin
  if not public.can_manage_team(p_team_id) then
    raise exception 'Only the team captain, vice captain or a league admin can do this'
      using errcode = '42501', detail = 'not_authorised';
  end if;
  select * into v_team from "Teams" where id = p_team_id;
  if not found then
    return jsonb_build_object('success', false, 'code', 'team_not_found', 'message', 'Team not found.');
  end if;

  v_name := coalesce(nullif(trim(p_name), ''), v_team.name);
  v_display := coalesce(nullif(trim(p_display_name), ''), v_team.display_name);
  v_abbr := v_team.abbreviation;
  if p_abbreviation is not null then
    if p_abbreviation !~ '^[A-Za-z]{3}$' then
      return jsonb_build_object('success', false, 'code', 'invalid_abbreviation', 'message', 'Abbreviation must be exactly 3 letters.');
    end if;
    v_abbr := upper(p_abbreviation);
  end if;

  if exists (select 1 from "Teams" where name = v_name and id <> p_team_id) then
    return jsonb_build_object('success', false, 'code', 'name_taken', 'message', 'That team name is already in use.');
  end if;
  if exists (select 1 from "Teams" where display_name = v_display and id <> p_team_id) then
    return jsonb_build_object('success', false, 'code', 'display_name_taken', 'message', 'That display name is already in use.');
  end if;
  if exists (select 1 from "Teams" where abbreviation = v_abbr and id <> p_team_id) then
    return jsonb_build_object('success', false, 'code', 'abbreviation_taken', 'message', 'That abbreviation is already in use.');
  end if;

  -- history: close the open entry for each changed column and open a new one
  for v_col, v_old, v_new in
    select * from (values
      ('name', v_team.name, v_name),
      ('display_name', v_team.display_name, v_display),
      ('abbreviation', v_team.abbreviation, v_abbr)) as c(col, old_v, new_v)
    where old_v is distinct from new_v
  loop
    update "TeamsHistory" set to_date = v_now
     where column_name = v_col and target_id = p_team_id and to_date is null;
    insert into "TeamsHistory" (table_name, target_id, column_name, old_value, new_value,
                                from_date, to_date, changed_by, changed_at)
    values ('Teams', p_team_id, v_col, v_old, v_new, v_now, null, auth.uid(), v_now);
    v_changes := v_changes || jsonb_build_object(v_col, v_new);
  end loop;

  update "Teams" set name = v_name, display_name = v_display, abbreviation = v_abbr, updated_at = v_now
   where id = p_team_id;

  return jsonb_build_object('success', true, 'changes', v_changes);
end $$;

revoke all on function public.update_team_details(uuid, text, text, text) from public, anon;
grant execute on function public.update_team_details(uuid, text, text, text) to authenticated;

drop function if exists public.log_and_update_changes(text, uuid, jsonb, uuid);
