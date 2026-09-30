-- When a player becomes active on a main team, their other pending requests and invites for main
-- teams in the same league are withdrawn (unless the league allows multi-team membership, where
-- those requests are still valid). Squad (child) teams are not touched.
create or replace function public.cancel_other_pending_on_join()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_district uuid; v_parent uuid; v_multi boolean;
begin
  if new.status <> 'active' or (tg_op = 'UPDATE' and old.status = 'active') then
    return new;
  end if;

  select t.district, t.parent_team_id into v_district, v_parent from "Teams" t where t.id = new.team_id;
  if v_parent is not null or v_district is null then
    return new;
  end if;

  select coalesce(allow_multi_team_membership, false) into v_multi from "Districts" where id = v_district;
  if v_multi then
    return new;
  end if;

  update "TeamPlayers" tp
     set status = 'revoked', revoked_at = now(), revoked_by = null
    from "Teams" t
   where tp.team_id = t.id
     and t.district = v_district
     and t.parent_team_id is null
     and tp.player_id = new.player_id
     and tp.team_id <> new.team_id
     and tp.status in ('requested', 'invited', 'pending_captain', 'pending_admin', 'pending_player', 'pending_both');

  return new;
end $$;

revoke all on function public.cancel_other_pending_on_join() from public, anon, authenticated;

drop trigger if exists trg_cancel_other_pending_on_join on "TeamPlayers";
create trigger trg_cancel_other_pending_on_join
  after insert or update of status on "TeamPlayers"
  for each row execute function public.cancel_other_pending_on_join();
