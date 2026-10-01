-- transfer_captaincy / transfer_vice_captaincy were SECURITY INVOKER with no
-- authorisation. They changed TeamPlayers roles as the caller and then tried to
-- notify every team member, which the Notifications RLS policy (own rows only)
-- rejects, so the whole call failed for any team with more than one member.
-- They now run as the definer and only the team's captain may use them.

do $patch$
declare
  v_reg regprocedure;
  v_def text;
  v_new text;
  v_regs regprocedure[] := array[
    'public.transfer_captaincy(uuid,uuid)'::regprocedure,
    'public.transfer_vice_captaincy(uuid,uuid)'::regprocedure
  ];
begin
  foreach v_reg in array v_regs loop
    v_def := pg_get_functiondef(v_reg);
    v_new := regexp_replace(v_def, 'LANGUAGE plpgsql\s+AS', E'LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''public''\nAS');
    v_new := regexp_replace(v_new, 'begin\s',
      E'begin\n    if not exists (\n        select 1 from "TeamPlayers" tp\n        where tp.team_id = p_team_id\n          and tp.player_id = public.current_player_id()\n          and tp.role = ''captain''\n          and tp.status = ''active''\n    ) then\n        raise exception ''Only the team captain can do this'' using errcode = ''42501'';\n    end if;\n\n');
    if v_new = v_def or v_new not like '%SECURITY DEFINER%' or v_new not like '%Only the team captain%' then
      raise exception 'patch for % did not apply', v_reg;
    end if;
    execute v_new;
  end loop;
end
$patch$;

revoke all on function public.transfer_captaincy(uuid, uuid) from public, anon;
revoke all on function public.transfer_vice_captaincy(uuid, uuid) from public, anon;
grant execute on function public.transfer_captaincy(uuid, uuid) to authenticated;
grant execute on function public.transfer_vice_captaincy(uuid, uuid) to authenticated;
