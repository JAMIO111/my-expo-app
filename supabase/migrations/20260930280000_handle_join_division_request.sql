-- The app called handle_join_division_request, which did not exist, so league admins could
-- never approve or reject a team's request to join a division.
create or replace function public.handle_join_division_request(
  p_request_id uuid, p_action text, p_admin_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.current_player_id();
  v_dm "DivisionMembers"%rowtype;
  v_district uuid;
begin
  select * into v_dm from "DivisionMembers" where id = p_request_id for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Request not found');
  end if;
  select district into v_district from "Divisions" where id = v_dm.division_id;
  -- p_admin_id is ignored: the caller is whoever is signed in
  if v_me is null or not public.is_district_admin(v_district) then
    raise exception 'Only a league admin can do this' using errcode = '42501', detail = 'not_authorised';
  end if;
  if v_dm.status <> 'pending_admin' then
    return jsonb_build_object('success', false, 'code', 'invalid_status', 'message', 'This request is no longer pending');
  end if;

  if p_action = 'approve' then
    update "DivisionMembers"
       set status = 'active', accepted_by = v_me, accepted_at = now(), joined_at = now()
     where id = p_request_id;
    if v_dm.team_id is not null then
      update "Teams"
         set division = v_dm.division_id,
             status = case when status in ('pending', 'pending_approval') or status is null then 'active' else status end,
             updated_at = now()
       where id = v_dm.team_id;
    end if;
  elsif p_action = 'reject' then
    update "DivisionMembers" set status = 'rejected', accepted_by = v_me, accepted_at = now()
     where id = p_request_id;
  else
    return jsonb_build_object('success', false, 'code', 'invalid_action', 'message', 'Unknown action');
  end if;

  return jsonb_build_object('success', true);
end $$;

revoke all on function public.handle_join_division_request(uuid, text, uuid) from public, anon;
grant execute on function public.handle_join_division_request(uuid, text, uuid) to authenticated;
