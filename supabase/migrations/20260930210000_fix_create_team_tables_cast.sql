-- create_team_with_address inserted payload->>'_tables' (text) into
-- Addresses.tables, which is a smallint, so creating a team failed with a
-- datatype error. Cast it.
do $patch$
declare
  v_def text := pg_get_functiondef('public.create_team_with_address(jsonb)'::regprocedure);
  v_new text;
begin
  v_new := replace(v_def, 'payload->>''_tables''', 'nullif(payload->>''_tables'', '''')::smallint');
  if v_new = v_def then raise exception 'create_team_with_address tables patch changed nothing'; end if;
  execute v_new;
end
$patch$;
