// hooks/useUpcomingFixtures.js
import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export const useUpcomingFixtures = (teamId, options = { nextOnly: false }) => {
  const { client: supabase } = useSupabaseClient();

  const fetchUpcomingFixtures = async (teamId, nextOnly) => {
    if (!teamId) throw new Error('Team ID is required');

    let query = supabase
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

    if (nextOnly) {
      query = query.limit(1); // only fetch the next upcoming match
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message || 'Failed to fetch upcoming fixtures');

    return data.map((fixture) => ({
      ...fixture,
      date: new Date(fixture.date_time),
      homeTeam: {
        ...fixture.homeTeam,
        abbreviation: fixture.homeTeam?.abbreviation || 'N/A',
      },
      awayTeam: {
        ...fixture.awayTeam,
        abbreviation: fixture.awayTeam?.abbreviation || 'N/A',
      },
    }));
  };

  return useQuery({
    queryKey: ['upcoming-fixtures', teamId, options.nextOnly],
    queryFn: () => fetchUpcomingFixtures(teamId, options.nextOnly),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};
