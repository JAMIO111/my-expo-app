-- Lets the manage-team screen tell an admin straight away that a join code is already used by another team.
create or replace function public.team_code_available(p_team_id uuid, p_code text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if public.current_player_id() is null then
    raise exception 'Not signed in' using errcode = '42501', detail = 'not_authorised';
  end if;
  if p_code is null or p_code !~ '^[0-9]{6}$' then return false; end if;
  return not exists (select 1 from "Teams" where code = p_code and id is distinct from p_team_id);
end $$;
revoke all on function public.team_code_available(uuid, text) from public, anon;
grant execute on function public.team_code_available(uuid, text) to authenticated;
