import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

async function fetchBracketData(competitionInstanceId) {
  const { data: stages } = await supabase
    .from('Stages')
    .select('*')
    .eq('competition_instance_id', competitionInstanceId)
    .eq('stage_type', 'knockout')
    .order('stage_order');

  const { data: fixtures } = await supabase
    .from('Fixtures')
    .select('*')
    .eq('competition_instance_id', competitionInstanceId);

  // =========================
  // 1. Detect participant type
  // =========================
  const isIndividual = fixtures?.some((f) => f.home_player || f.away_player);

  const teamIds = [
    ...new Set(fixtures?.flatMap((f) => [f.home_team, f.away_team].filter(Boolean)) ?? []),
  ];

  const playerIds = [
    ...new Set(fixtures?.flatMap((f) => [f.home_player, f.away_player].filter(Boolean)) ?? []),
  ];

  let teamsMap = {};
  let playersMap = {};

  // =========================
  // 2. Fetch teams
  // =========================
  if (teamIds.length) {
    const { data: teams } = await supabase
      .from('Teams')
      .select('id, name, display_name')
      .in('id', teamIds);

    teamsMap = Object.fromEntries((teams ?? []).map((t) => [t.id, t.display_name || t.name]));
  }

  // =========================
  // 3. Fetch players (individuals)
  // =========================
  if (playerIds.length) {
    const { data: players } = await supabase
      .from('Players')
      .select('id, first_name, surname')
      .in('id', playerIds);

    playersMap = Object.fromEntries(
      (players ?? []).map((p) => [p.id, `${p.first_name} ${p.surname}`])
    );
  }

  const { data: frames } = await supabase
    .from('Results')
    .select('winner_side, fixture_id')
    .in(
      'fixture_id',
      fixtures.map((f) => f.id)
    );

  const framesByFixture = (frames ?? []).reduce((acc, frame) => {
    (acc[frame.fixture_id] ??= []).push(frame);
    return acc;
  }, {});

  return {
    stages: stages ?? [],
    fixtures: fixtures ?? [],
    teams: teamsMap,
    players: playersMap,
    frames: framesByFixture,
    isIndividual,
  };
}

export function useKnockoutBracket(competitionInstanceId) {
  return useQuery({
    queryKey: ['knockout-bracket', competitionInstanceId],
    queryFn: () => fetchBracketData(competitionInstanceId),
    enabled: !!competitionInstanceId,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });
}
