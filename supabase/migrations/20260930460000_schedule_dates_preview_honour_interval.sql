-- generate_schedule_dates_preview accepted p_frequency_interval but never used it, so "every 2 weeks" /
-- "every 2 months" produced weekly / monthly dates. Apply it to the weekly and monthly stepping.
do $$
declare
  v_def text;
  v_new text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'generate_schedule_dates_preview';

  v_new := regexp_replace(v_def, 'v_cycle_index\s*\*\s*7', 'v_cycle_index * 7 * greatest(coalesce(p_frequency_interval, 1), 1)');
  v_new := regexp_replace(v_new, 'months\s*=>\s*v_cycle_index', 'months => v_cycle_index * greatest(coalesce(p_frequency_interval, 1), 1)');

  if v_new = v_def or position('p_frequency_interval, 1' in v_new) = 0 then
    raise exception 'generate_schedule_dates_preview was not patched';
  end if;
  execute v_new;
end $$;
