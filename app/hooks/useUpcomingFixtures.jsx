// hooks/useUpcomingFixtures.js
import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

const fetchUpcomingFixtures = async (teamId) => {
  if (!teamId) throw new Error('Team ID is required');

  const { data, error } = await supabase
    .from('Fixtures')
    .select(
      `
        *,
        homeTeam:Teams!Fixtures_home_team_fkey(id, display_name, abbreviation, crest),
        awayTeam:Teams!Fixtures_away_team_fkey(id, display_name, abbreviation, crest)
      `
    )
    .or(`home_team.eq.${teamId},away_team.eq.${teamId}`)
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch upcoming fixtures');

  return data.map((fixture) => ({
    ...fixture,
    date: new Date(fixture.date),
    homeTeam: {
      ...fixture.homeTeam,
      abbreviation: fixture.homeTeam.abbreviation || 'N/A',
    },
    awayTeam: {
      ...fixture.awayTeam,
      abbreviation: fixture.awayTeam.abbreviation || 'N/A',
    },
  }));
};

export const useUpcomingFixtures = (teamId) => {
  return useQuery({
    queryKey: ['upcoming-fixtures', teamId],
    queryFn: () => fetchUpcomingFixtures(teamId),
    enabled: !!teamId, // Only run query if teamId is defined
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
