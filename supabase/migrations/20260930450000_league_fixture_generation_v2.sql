-- League fixture generation v2.
--
-- generate_league_fixtures_from_dates
--   * Every participant plays every other once per cycle; cycle 2 reverses every cycle-1 fixture in the
--     same round order (and further cycles alternate), so a two-leg league has each pairing home and away.
--   * Home/away is built from the canonical minimum-break round-robin pattern (about n-2 breaks per leg,
--     no team with more than one), then refined by a local search against the table constraint below.
--   * Table constraint: for every calendar day (Europe/London), the number of matches hosted at an
--     address - including fixtures already scheduled for other divisions - may not exceed that
--     address's `tables`. Teams with no address, and individual competitions, are unconstrained.
--     If no valid arrangement exists the function raises, naming the clash.
--   * Only active participants (status = 'active', not left) are scheduled.
--   * Fixes the individual-competition path, which referenced columns that do not exist
--     (Players.last_name / Players.avatar; the columns are surname / avatar_url).
--   * Dates are parsed as timestamptz and emitted as explicit UTC, so the result no longer depends on
--     the session time zone; an empty/short date list now raises instead of failing with a NULL.
--
-- save_league_fixtures
--   * Re-checks the table constraint on the posted fixtures (the client can send anything), refuses to
--     save twice for the same competition instance, and parses datetime as timestamptz.

------------------------------------------------------------
-- Cost / constraint evaluator (pure function over arrays)
--
-- Returns {overload, breaks, imbalance} followed (when p_collect) by the cycle-1 match indices whose
-- home venue is over capacity on one of their dates.
------------------------------------------------------------
create or replace function public._rr_eval(
  p_half int, p_rounds int, p_cycles int,
  p_ta int[], p_tb int[], p_o int[],
  p_grp int[], p_team_addr int[], p_cap int[], p_base int[],
  p_naddr int, p_ngrp int, p_nteams int,
  p_collect boolean default false
) returns int[]
language plpgsql
immutable
as $$
declare
  v_over int := 0;
  v_breaks int := 0;
  v_imb int := 0;
  v_load int[];
  v_last int[];
  v_hc int[];
  v_ac int[];
  v_bad int[] := '{}';
  c int; r int; m int; idx int; gr int;
  home int; away int; cell int; ad int; g int; a int; t int;
begin
  v_load := case when p_naddr > 0 then p_base else '{}'::int[] end;
  v_last := array_fill(0, array[p_nteams]);
  v_hc   := array_fill(0, array[p_nteams]);
  v_ac   := array_fill(0, array[p_nteams]);

  for c in 1..p_cycles loop
    for r in 1..p_rounds loop
      gr := p_grp[(c - 1) * p_rounds + r];
      for m in 1..p_half loop
        idx := (r - 1) * p_half + m;
        if p_ta[idx] = 0 then continue; end if;

        -- odd cycles keep cycle 1's orientation, even cycles reverse it
        if (p_o[idx] = 0) = (c % 2 = 1) then
          home := p_ta[idx]; away := p_tb[idx];
        else
          home := p_tb[idx]; away := p_ta[idx];
        end if;

        if p_naddr > 0 then
          ad := p_team_addr[home];
          if ad > 0 then
            cell := (gr - 1) * p_naddr + ad;
            v_load[cell] := v_load[cell] + 1;
          end if;
        end if;

        if v_last[home] = 1 then v_breaks := v_breaks + 1; end if;
        v_last[home] := 1;
        if v_last[away] = 2 then v_breaks := v_breaks + 1; end if;
        v_last[away] := 2;

        v_hc[home] := v_hc[home] + 1;
        v_ac[away] := v_ac[away] + 1;
      end loop;
    end loop;
  end loop;

  if p_naddr > 0 then
    for g in 1..p_ngrp loop
      for a in 1..p_naddr loop
        cell := (g - 1) * p_naddr + a;
        if v_load[cell] > p_cap[a] then
          v_over := v_over + (v_load[cell] - p_cap[a]);
        end if;
      end loop;
    end loop;
  end if;

  for t in 1..p_nteams loop
    v_imb := v_imb + greatest(abs(v_hc[t] - v_ac[t]) - 1, 0);
  end loop;

  if p_collect and v_over > 0 then
    for c in 1..p_cycles loop
      for r in 1..p_rounds loop
        gr := p_grp[(c - 1) * p_rounds + r];
        for m in 1..p_half loop
          idx := (r - 1) * p_half + m;
          if p_ta[idx] = 0 then continue; end if;
          if (p_o[idx] = 0) = (c % 2 = 1) then home := p_ta[idx]; else home := p_tb[idx]; end if;
          ad := p_team_addr[home];
          if ad > 0 then
            cell := (gr - 1) * p_naddr + ad;
            if v_load[cell] > p_cap[ad] and not (idx = any (v_bad)) then
              v_bad := v_bad || idx;
            end if;
          end if;
        end loop;
      end loop;
    end loop;
  end if;

  return array[v_over, v_breaks, v_imb] || v_bad;
end;
$$;

revoke all on function public._rr_eval(int, int, int, int[], int[], int[], int[], int[], int[], int[], int, int, int, boolean) from public, anon, authenticated;

------------------------------------------------------------
-- Generator
------------------------------------------------------------
create or replace function public.generate_league_fixtures_from_dates(
  p_competition_instance_id uuid,
  p_dates jsonb,
  p_rounds integer default 2
) returns jsonb
language plpgsql
as $function$
declare
  v_competition_id  uuid;
  v_competitor_type text;

  v_parts   uuid[];           -- participants, padded with NULL for a bye
  v_n       int;              -- padded participant count (even)
  v_half    int;
  v_rc      int;              -- rounds per cycle
  v_real    int;
  v_participants_json jsonb;

  v_dates   timestamptz[];
  v_needed  int;

  -- date groups: matches on the same London calendar day share table capacity
  v_day     date;
  v_day_list date[] := '{}';
  v_grp     int[];
  v_ngrp    int := 0;

  -- addresses
  v_addr_ids  uuid[] := '{}';
  v_team_addr int[];
  v_cap       int[] := '{}';
  v_base      int[];
  v_naddr     int := 0;
  v_ai        int;
  rec         record;

  -- schedule arrays (cycle 1): index = (round-1)*half + match
  v_ta int[]; v_tb int[]; v_o int[];
  v_best_ta int[]; v_best_tb int[]; v_best_o int[];
  v_perm int[];

  v_ev int[]; v_ev2 int[];
  v_score int; v_cur_score int; v_cand_score int; v_cand_best int; v_cand_idx int;
  v_best_ev int[];
  v_best_score int;
  v_found int := 0;
  v_deadline timestamptz;
  v_iter int;
  v_attempt int;

  r int; k int; a int; b int; idx int; i int; c int; m int;
  v_cand int;
  v_pass int;
  v_improved boolean;

  v_calendar jsonb := '[]'::jsonb;
  v_matches  jsonb;
  v_home int; v_away int;
  v_msg text;
begin
  if p_rounds is null or p_rounds < 1 then
    raise exception 'Rounds must be at least 1';
  end if;

  select ci.competition_id into v_competition_id
  from "CompetitionInstances" ci where ci.id = p_competition_instance_id;
  if v_competition_id is null then
    raise exception 'Competition instance not found';
  end if;

  select c.competitor_type into v_competitor_type
  from "Competitions" c where c.id = v_competition_id;

  ----------------------------------------------------------
  -- Participants (active only)
  ----------------------------------------------------------
  if v_competitor_type = 'team' then
    select coalesce(array_agg(cp.team_id order by cp.team_id), array[]::uuid[])
      into v_parts
    from "CompetitionParticipants" cp
    where cp.competition_instance_id = p_competition_instance_id
      and cp.team_id is not null
      and cp.status = 'active'
      and cp.left_at is null;

    select jsonb_agg(jsonb_build_object(
             'id', t.id, 'name', t.display_name, 'avatar_or_logo', t.crest, 'type', 'team'))
      into v_participants_json
    from "Teams" t where t.id = any (v_parts);
  else
    select coalesce(array_agg(cp.player_id order by cp.player_id), array[]::uuid[])
      into v_parts
    from "CompetitionParticipants" cp
    where cp.competition_instance_id = p_competition_instance_id
      and cp.player_id is not null
      and cp.status = 'active'
      and cp.left_at is null;

    select jsonb_agg(jsonb_build_object(
             'id', p.id,
             'name', trim(concat_ws(' ', p.first_name, p.surname)),
             'avatar_or_logo', p.avatar_url, 'type', 'player'))
      into v_participants_json
    from "Players" p where p.id = any (v_parts);
  end if;

  v_real := coalesce(array_length(v_parts, 1), 0);
  if v_real < 2 then
    raise exception 'Not enough participants';
  end if;

  -- odd number: a NULL participant is the bye
  if v_real % 2 = 1 then
    v_parts := array_append(v_parts, null);
  end if;
  v_n    := array_length(v_parts, 1);
  v_half := v_n / 2;
  v_rc   := v_n - 1;
  v_needed := v_rc * p_rounds;

  ----------------------------------------------------------
  -- Dates
  ----------------------------------------------------------
  select array_agg((elem ->> 'datetime')::timestamptz order by (elem ->> 'datetime')::timestamptz)
    into v_dates
  from jsonb_array_elements(coalesce(p_dates, '[]'::jsonb)) elem
  where elem ->> 'datetime' is not null;

  if coalesce(array_length(v_dates, 1), 0) < v_needed then
    raise exception 'Not enough dates: need %, got %', v_needed, coalesce(array_length(v_dates, 1), 0);
  end if;

  v_grp := array_fill(0, array[v_needed]);
  for k in 1..v_needed loop
    v_day := (v_dates[k] at time zone 'Europe/London')::date;
    i := array_position(v_day_list, v_day);
    if i is null then
      v_day_list := v_day_list || v_day;
      i := array_length(v_day_list, 1);
    end if;
    v_grp[k] := i;
  end loop;
  v_ngrp := array_length(v_day_list, 1);

  ----------------------------------------------------------
  -- Addresses and existing load (teams only)
  ----------------------------------------------------------
  v_team_addr := array_fill(0, array[v_n]);

  if v_competitor_type = 'team' then
    for i in 1..v_n loop
      if v_parts[i] is null then continue; end if;
      select a2.id, coalesce(a2.tables, 1000) as cap
        into rec
      from "Teams" t
      join "Addresses" a2 on a2.id = t.address
      where t.id = v_parts[i];

      if rec.id is not null then
        v_ai := array_position(v_addr_ids, rec.id);
        if v_ai is null then
          v_addr_ids := v_addr_ids || rec.id;
          v_cap := v_cap || greatest(rec.cap, 1);   -- NULL tables = effectively unlimited; never below 1
          v_ai := array_length(v_addr_ids, 1);
        end if;
        v_team_addr[i] := v_ai;
      end if;
    end loop;
  end if;

  v_naddr := coalesce(array_length(v_addr_ids, 1), 0);

  if v_naddr > 0 then
    v_base := array_fill(0, array[v_ngrp * v_naddr]);
    for rec in
      select (f.date_time at time zone 'Europe/London')::date as d,
             coalesce(f.venue_id, t.address) as addr,
             count(*)::int as n
      from "Fixtures" f
      join "Teams" t on t.id = f.home_team
      where coalesce(f.venue_id, t.address) = any (v_addr_ids)
        and (f.date_time at time zone 'Europe/London')::date = any (v_day_list)
        and not f.is_forfeited
      group by 1, 2
    loop
      v_base[(array_position(v_day_list, rec.d) - 1) * v_naddr + array_position(v_addr_ids, rec.addr)] := rec.n;
    end loop;
  else
    v_base := '{}'::int[];
  end if;

  ----------------------------------------------------------
  -- Search: canonical min-break home/away, repaired against table limits
  ----------------------------------------------------------
  v_deadline := clock_timestamp() + interval '6 seconds';

  for v_attempt in 1..80 loop
    -- no table limits in play: the canonical pattern is deterministic, so one good attempt is enough
    exit when v_best_ev is not null
      and (v_found >= case when v_naddr = 0 then 1 else 4 end or clock_timestamp() > v_deadline);

    -- random labelling of the circle
    -- shuffle the real participants only; a bye (NULL, last slot) always takes the fixed circle position,
    -- which gives odd fields a break-free home/away pattern
    select array_agg(x order by random()) into v_perm from generate_series(1, v_real) x;
    if v_n > v_real then
      v_perm := v_perm || v_n;
    end if;

    v_ta := array_fill(0, array[v_rc * v_half]);
    v_tb := array_fill(0, array[v_rc * v_half]);
    v_o  := array_fill(0, array[v_rc * v_half]);

    for r in 0..(v_rc - 1) loop
      for m in 1..v_half loop
        idx := r * v_half + m;
        if m = 1 then
          a := v_perm[r + 1];            -- circle label r
          b := v_perm[v_n];              -- fixed team
          v_o[idx] := case when r % 2 = 0 then 0 else 1 end;
        else
          k := m - 1;
          a := v_perm[((r + k) % v_rc) + 1];
          b := v_perm[(((r - k) % v_rc + v_rc) % v_rc) + 1];
          v_o[idx] := case when k % 2 = 1 then 0 else 1 end;
        end if;
        if v_parts[a] is null or v_parts[b] is null then
          v_ta[idx] := 0; v_tb[idx] := 0; v_o[idx] := 0;   -- bye: no match
        else
          v_ta[idx] := a; v_tb[idx] := b;
        end if;
      end loop;
    end loop;

    v_ev := public._rr_eval(v_half, v_rc, p_rounds, v_ta, v_tb, v_o, v_grp, v_team_addr, v_cap, v_base,
                            v_naddr, v_ngrp, v_n, true);
    v_iter := 0;

    while v_ev[1] > 0 and v_iter < 80 loop
      v_iter := v_iter + 1;
      v_cur_score := v_ev[1] * 1000 + v_ev[2] * 10 + v_ev[3];
      v_cand_best := null;
      v_cand_idx := null;
      v_ev2 := null;

      -- try flipping each match that is hosting an over-capacity venue
      for i in 4..coalesce(array_length(v_ev, 1), 3) loop
        v_cand := v_ev[i];
        v_o[v_cand] := 1 - v_o[v_cand];
        v_ev2 := public._rr_eval(v_half, v_rc, p_rounds, v_ta, v_tb, v_o, v_grp, v_team_addr, v_cap,
                                 v_base, v_naddr, v_ngrp, v_n, false);
        v_o[v_cand] := 1 - v_o[v_cand];
        v_cand_score := v_ev2[1] * 1000 + v_ev2[2] * 10 + v_ev2[3];
        if v_cand_score < v_cur_score and (v_cand_best is null or v_cand_score < v_cand_best) then
          v_cand_best := v_cand_score;
          v_cand_idx := v_cand;
        end if;
      end loop;

      exit when v_cand_idx is null;

      v_o[v_cand_idx] := 1 - v_o[v_cand_idx];
      v_ev := public._rr_eval(v_half, v_rc, p_rounds, v_ta, v_tb, v_o, v_grp, v_team_addr, v_cap, v_base,
                              v_naddr, v_ngrp, v_n, true);
    end loop;

    -- Refinement: with a valid arrangement, flip single matches (together with their mirror in later
    -- cycles) while that lowers breaks/imbalance. Needed for byes (odd fields), where the canonical
    -- pattern shifts parity, and for the seam between cycles. Skipped when the single-cycle even
    -- pattern is already at its minimum of (n - 2) breaks.
    if v_ev[1] = 0 and not (p_rounds = 1 and v_real % 2 = 0 and v_ev[2] <= v_n - 2) then
      v_pass := 0;
      loop
        exit when v_pass >= 3 or clock_timestamp() > v_deadline;
        v_pass := v_pass + 1;
        v_improved := false;

        for i in 1..array_length(v_o, 1) loop
          if v_ta[i] = 0 then continue; end if;
          v_o[i] := 1 - v_o[i];
          v_ev2 := public._rr_eval(v_half, v_rc, p_rounds, v_ta, v_tb, v_o, v_grp, v_team_addr, v_cap,
                                   v_base, v_naddr, v_ngrp, v_n, false);
          if v_ev2[1] = 0
             and (v_ev2[2] * 10 + v_ev2[3]) < (v_ev[2] * 10 + v_ev[3]) then
            v_ev := v_ev2;
            v_improved := true;
          else
            v_o[i] := 1 - v_o[i];
          end if;
        end loop;

        exit when not v_improved;
      end loop;
    end if;

    v_score := v_ev[1] * 1000 + v_ev[2] * 10 + v_ev[3];
    if v_ev[1] = 0 then v_found := v_found + 1; end if;

    if v_best_ev is null or v_score < v_best_score then
      v_best_score := v_score;
      v_best_ev := v_ev;
      v_best_ta := v_ta; v_best_tb := v_tb; v_best_o := v_o;
    end if;
  end loop;

  if v_best_ev[1] > 0 then
    -- name a venue that cannot be accommodated so the admin knows what to change
    idx := v_best_ev[4];
    if idx is not null then
      a := case when v_best_o[idx] = 0 then v_best_ta[idx] else v_best_tb[idx] end;
      select coalesce(ad.name, ad.line_1, 'A venue') as addr_name, ad.tables
        into rec
      from "Teams" t join "Addresses" ad on ad.id = t.address
      where t.id = v_parts[a];
      v_msg := format('%s has %s table(s) but more matches are scheduled there on the same day',
                      rec.addr_name, rec.tables);
    else
      v_msg := 'a venue has more matches scheduled on one day than it has tables';
    end if;
    raise exception 'Cannot build fixtures within table limits: %. Add dates, free up tables or move teams to other venues.', v_msg;
  end if;

  ----------------------------------------------------------
  -- Output
  ----------------------------------------------------------
  for c in 1..p_rounds loop
    for r in 1..v_rc loop
      k := (c - 1) * v_rc + r;
      v_matches := '[]'::jsonb;

      for m in 1..v_half loop
        idx := (r - 1) * v_half + m;
        if v_best_ta[idx] = 0 then continue; end if;

        if (v_best_o[idx] = 0) = (c % 2 = 1) then
          v_home := v_best_ta[idx]; v_away := v_best_tb[idx];
        else
          v_home := v_best_tb[idx]; v_away := v_best_ta[idx];
        end if;

        v_matches := v_matches || jsonb_build_object(
          'cycle',        c,
          'round',        k,
          'fixture_date', to_char(v_dates[k] at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"+00:00"'),
          'home_id',      v_parts[v_home],
          'away_id',      v_parts[v_away]
        );
      end loop;

      v_calendar := v_calendar || jsonb_build_object(
        'datetime', to_char(v_dates[k] at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"+00:00"'),
        'fixtures', v_matches
      );
    end loop;
  end loop;

  return jsonb_build_object(
    'competition_instance_id', p_competition_instance_id,
    'participants',            v_participants_json,
    'total_rounds',            v_rc * p_rounds,
    'home_away_breaks',        v_best_ev[2],
    'dates',                   v_calendar
  );
end;
$function$;

------------------------------------------------------------
-- Preview: the bye-padded participant count must use the same active-only filter
------------------------------------------------------------
do $$
declare
  v_def text;
  v_new text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'generate_schedule_dates_preview';

  v_new := replace(v_def,
    'AND team_id IS NOT NULL;',
    $r$AND team_id IS NOT NULL AND status = 'active' AND left_at IS NULL;$r$);
  v_new := replace(v_new,
    'AND player_id IS NOT NULL;',
    $r$AND player_id IS NOT NULL AND status = 'active' AND left_at IS NULL;$r$);

  if v_new = v_def then
    raise exception 'generate_schedule_dates_preview was not patched';
  end if;
  execute v_new;
end $$;

------------------------------------------------------------
-- save_league_fixtures: server-side table check, no double save, timestamptz parse
------------------------------------------------------------
do $$
declare
  v_def text;
  v_new text;
  v_check text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'save_league_fixtures';

  v_check := $chk$
    IF EXISTS (
        SELECT 1 FROM public."CompetitionInstances" ci
        WHERE ci.id = p_competition_instance_id AND ci.fixtures_generated
    ) THEN
        RAISE EXCEPTION 'FIXTURES_ALREADY_GENERATED';
    END IF;

    /*
      Table limit: matches hosted at one address on one London calendar day may not exceed its tables,
      counting fixtures already scheduled for other divisions.
    */
    IF v_competitor_type = 'team' THEN
        PERFORM 1
        FROM (
            SELECT (nf.dt AT TIME ZONE 'Europe/London')::date AS day, t.address AS addr, count(*) AS n
            FROM (
                SELECT (d->>'datetime')::timestamptz AS dt, (fx->>'home_id')::uuid AS home
                FROM jsonb_array_elements(p_fixtures) d,
                     jsonb_array_elements(d->'fixtures') fx
            ) nf
            JOIN public."Teams" t ON t.id = nf.home AND t.address IS NOT NULL
            GROUP BY 1, 2
        ) newload
        JOIN public."Addresses" ad ON ad.id = newload.addr AND ad.tables IS NOT NULL
        LEFT JOIN LATERAL (
            SELECT count(*) AS n
            FROM public."Fixtures" f
            JOIN public."Teams" ft ON ft.id = f.home_team
            WHERE coalesce(f.venue_id, ft.address) = newload.addr
              AND (f.date_time AT TIME ZONE 'Europe/London')::date = newload.day
              AND NOT f.is_forfeited
        ) ex ON true
        WHERE newload.n + coalesce(ex.n, 0) > ad.tables
        LIMIT 1;

        IF FOUND THEN
            RAISE EXCEPTION 'TABLE_CAPACITY_EXCEEDED'
                USING DETAIL = 'More matches are scheduled at a venue on one day than it has tables';
        END IF;
    END IF;

$chk$;

  v_new := regexp_replace(v_def, '(/\*\s+Get league stage)', v_check || E'\n    \\1');
  v_new := replace(v_new,
    '((v_date_entry->>''datetime'')::timestamp AT TIME ZONE ''UTC'')',
    '(v_date_entry->>''datetime'')::timestamptz');

  if v_new = v_def or position('TABLE_CAPACITY_EXCEEDED' in v_new) = 0
     or position('::timestamp AT TIME ZONE' in v_new) > 0 then
    raise exception 'save_league_fixtures was not patched correctly';
  end if;
  execute v_new;
end $$;
