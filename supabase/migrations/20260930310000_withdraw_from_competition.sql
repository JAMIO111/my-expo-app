-- CompetitionParticipants is now admin-write-only, so a captain or player leaving a competition
-- (or cancelling a join request) needs a checked function instead of a direct update.
create or replace function public.withdraw_from_competition(p_instance_id uuid, p_team_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := public.current_player_id();
  v_row "CompetitionParticipants"%rowtype;
begin
  if v_me is null then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'Player not found');
  end if;

  if p_team_id is not null then
    if not public.is_team_leader(p_team_id) then
      return jsonb_build_object('success', false, 'code', 'forbidden', 'message', 'Only the captain or vice captain can withdraw the team');
    end if;
    select * into v_row from "CompetitionParticipants"
     where competition_instance_id = p_instance_id and team_id = p_team_id and status in ('active', 'requested')
     for update;
  else
    select * into v_row from "CompetitionParticipants"
     where competition_instance_id = p_instance_id and player_id = v_me and status in ('active', 'requested')
     for update;
  end if;

  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found', 'message', 'You are not entered in this competition');
  end if;

  update "CompetitionParticipants"
     set status = case when v_row.status = 'active' then 'left' else 'cancelled' end,
         left_at = now()
   where id = v_row.id;

  return jsonb_build_object('success', true, 'previousStatus', v_row.status);
end $$;

revoke all on function public.withdraw_from_competition(uuid, uuid) from public, anon;
grant execute on function public.withdraw_from_competition(uuid, uuid) to authenticated;
