import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// reuse your existing function
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

  const teamIds = [
    ...new Set(fixtures?.flatMap((f) => [f.home_team, f.away_team].filter(Boolean)) ?? []),
  ];

  let teamsMap = {};

  if (teamIds.length) {
    const { data: teams } = await supabase.from('Teams').select('id, name').in('id', teamIds);

    teamsMap = Object.fromEntries(teams?.map((t) => [t.id, t.name]) ?? []);
  }

  return {
    stages: stages ?? [],
    fixtures: fixtures ?? [],
    teams: teamsMap,
  };
}

export function useKnockoutBracket(competitionInstanceId) {
  return useQuery({
    queryKey: ['knockout-bracket', competitionInstanceId],
    queryFn: () => fetchBracketData(competitionInstanceId),
    enabled: !!competitionInstanceId,
    staleTime: 1000 * 60 * 30, // 30 mins (tweak if needed)
    cacheTime: 1000 * 60 * 60, // keep in cache 60 mins
  });
}
