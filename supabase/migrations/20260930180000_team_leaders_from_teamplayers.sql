-- TeamPlayers.role is the single source of truth for who captains / vice
-- captains a team. Teams.captain and Teams.vice_captain are being phased out.
--
--   * team_captain_id / team_vice_captain_id read the leaders from TeamPlayers.
--   * Every DB function that read or wrote Teams.captain now uses TeamPlayers:
--       get_user_context      (team.captain / vice_captain keys and the role's
--                              captain object are derived from TeamPlayers, so
--                              the app's currentRole.team.captain keeps working)
--       get_teams_recruiting, leave_child_team, update_child_team,
--       create_child_team, create_team_with_address
--   * create_team_with_address now inserts the creator as the team's active
--     captain in TeamPlayers. It used to only set Teams.captain, so a newly
--     created team had no captain as far as fixtures and notifications go.
--   * Until the columns are dropped they are kept as a read-only mirror of
--     TeamPlayers by a trigger (so old app builds that still select them keep
--     working). Nothing should write them directly any more.

create or replace function public.team_captain_id(_team_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $function$
  select tp.player_id
  from "TeamPlayers" tp
  where tp.team_id = _team_id and tp.status = 'active' and tp.role = 'captain'
  order by tp.joined_at nulls last
  limit 1;
$function$;

create or replace function public.team_vice_captain_id(_team_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $function$
  select tp.player_id
  from "TeamPlayers" tp
  where tp.team_id = _team_id and tp.status = 'active' and tp.role = 'vice_captain'
  order by tp.joined_at nulls last
  limit 1;
$function$;

grant execute on function public.team_captain_id(uuid) to authenticated, anon;
grant execute on function public.team_vice_captain_id(uuid) to authenticated, anon;

-- Keep the deprecated Teams columns as a mirror of TeamPlayers.
create or replace function public.sync_team_leader_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_team uuid;
begin
  for v_team in
    select distinct t from unnest(array[
      case when tg_op <> 'DELETE' then new.team_id end,
      case when tg_op <> 'INSERT' then old.team_id end
    ]) t where t is not null
  loop
    update "Teams"
    set captain = public.team_captain_id(v_team),
        vice_captain = public.team_vice_captain_id(v_team)
    where id = v_team
      and (captain is distinct from public.team_captain_id(v_team)
           or vice_captain is distinct from public.team_vice_captain_id(v_team));
  end loop;
  return null;
end;
$function$;

drop trigger if exists trg_sync_team_leader_columns on public."TeamPlayers";
create trigger trg_sync_team_leader_columns
  after insert or delete or update of role, status, team_id on public."TeamPlayers"
  for each row execute function public.sync_team_leader_columns();

-- Patch the functions that touched Teams.captain. Each replacement must change
-- the function, otherwise the migration fails rather than silently skipping.
do $patch$
declare
  v_def text;
  v_new text;
  v_tmp text;
  v_regs regprocedure[] := array[
    'public.get_user_context(uuid)'::regprocedure,
    'public.get_teams_recruiting(uuid)'::regprocedure,
    'public.leave_child_team(uuid,uuid)'::regprocedure,
    'public.update_child_team(uuid,uuid,text,uuid,uuid[])'::regprocedure,
    'public.create_child_team(uuid,uuid,text,uuid,uuid[])'::regprocedure,
    'public.create_team_with_address(jsonb)'::regprocedure
  ];
  v_reg regprocedure;
begin
  foreach v_reg in array v_regs loop
    v_def := pg_get_functiondef(v_reg);
    v_new := v_def;

    if v_reg = 'public.get_user_context(uuid)'::regprocedure then
      v_new := replace(v_new, 'join "Players" pl on pl.id = t2.captain',
                       'join "Players" pl on pl.id = public.team_captain_id(t2.id)');
      v_new := replace(v_new, 'to_jsonb(t) || jsonb_build_object(',
                       'to_jsonb(t) || jsonb_build_object(''captain'', public.team_captain_id(t.id), ''vice_captain'', public.team_vice_captain_id(t.id), ');
      v_new := replace(v_new, 'to_jsonb(ct) || jsonb_build_object(',
                       'to_jsonb(ct) || jsonb_build_object(''captain'', public.team_captain_id(ct.id), ''vice_captain'', public.team_vice_captain_id(ct.id), ');
    elsif v_reg = 'public.get_teams_recruiting(uuid)'::regprocedure then
      v_new := replace(v_new, 'cap.id = t.captain', 'cap.id = public.team_captain_id(t.id)');
    elsif v_reg = 'public.leave_child_team(uuid,uuid)'::regprocedure then
      v_new := regexp_replace(v_new,
        'select 1 from "Teams"\s+where id\s+= _team_id\s+and\s+captain = _player_id',
        'select 1 from "TeamPlayers" where team_id = _team_id and player_id = _player_id and role = ''captain'' and status = ''active''');
    elsif v_reg = 'public.update_child_team(uuid,uuid,text,uuid,uuid[])'::regprocedure then
      v_new := regexp_replace(v_new,
        'select status, parent_team_id, captain\s+into v_current_status, v_parent_team_id, v_current_captain\s+from "Teams"',
        'select status, parent_team_id, public.team_captain_id(id) into v_current_status, v_parent_team_id, v_current_captain from "Teams"');
      v_new := regexp_replace(v_new, '\s+captain\s+= _captain_id,', '');
    elsif v_reg = 'public.create_child_team(uuid,uuid,text,uuid,uuid[])'::regprocedure then
      v_new := regexp_replace(v_new, 'parent_team_id,\s+captain,\s+status', 'parent_team_id, status');
      v_new := regexp_replace(v_new, '_parent_team_id,\s+_captain_id,\s+''pending''', '_parent_team_id, ''pending''');
    elsif v_reg = 'public.create_team_with_address(jsonb)'::regprocedure then
      v_new := regexp_replace(v_new, 'address,\s+captain,\s+cover_image_url', 'address, cover_image_url');
      v_new := regexp_replace(v_new, 'new_address\.id,\s+\(payload->>''_captain''\)::uuid,', 'new_address.id,');
      -- the creator becomes the team's active captain
      v_tmp := regexp_replace(v_new, 'returning \* into new_team;\s+return new_team;',
        'returning * into new_team; if (payload->>''_captain'') is not null then insert into "TeamPlayers" (team_id, player_id, role, status, joined_at) values (new_team.id, (payload->>''_captain'')::uuid, ''captain'', ''active'', now()); select * into new_team from "Teams" where id = new_team.id; end if; return new_team;');
      if v_tmp = v_new then
        raise exception 'create_team_with_address: captain insert patch changed nothing';
      end if;
      v_new := v_tmp;
    end if;

    if v_new = v_def then
      raise exception 'patch for % changed nothing', v_reg;
    end if;
    execute v_new;
  end loop;
end
$patch$;

-- Backfill the mirror from TeamPlayers.
update "Teams" t
set captain = public.team_captain_id(t.id),
    vice_captain = public.team_vice_captain_id(t.id)
where t.captain is distinct from public.team_captain_id(t.id)
   or t.vice_captain is distinct from public.team_vice_captain_id(t.id);

comment on column public."Teams".captain is 'DEPRECATED: read-only mirror of TeamPlayers (role = captain, status = active). Use team_captain_id(). Will be dropped.';
comment on column public."Teams".vice_captain is 'DEPRECATED: read-only mirror of TeamPlayers (role = vice_captain, status = active). Use team_vice_captain_id(). Will be dropped.';
