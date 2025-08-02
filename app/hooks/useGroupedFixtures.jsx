import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export const useMonthlyFixtures = ({ month, seasonId, divisionId }) => {
  const { client: supabase } = useSupabaseClient();

  const fetchFixturesByMonth = async ({ month, seasonId, divisionId }) => {
    const start = startOfMonth(month).toISOString();
    const end = endOfMonth(month).toISOString();

    const { data, error } = await supabase
      .from('Fixtures')
      .select(
        '*, home_team:Teams!Fixtures_home_team_fkey(display_name, crest, abbreviation), away_team:Teams!Fixtures_away_team_fkey(display_name,crest, abbreviation)'
      )
      .eq('season', seasonId)
      .eq('division', divisionId) // Adjust this if you need a different division
      .eq('approved', false)
      .gte('date_time', start)
      .lte('date_time', end)
      .order('date_time', { ascending: true });

    if (error) throw new Error(error.message);

    const grouped = {};

    for (const fixture of data) {
      const key = fixture.date_time.split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(fixture);
    }

    return grouped;
  };

  return useQuery({
    queryKey: ['fixtures-grouped', month?.toISOString(), seasonId, divisionId],
    queryFn: () => fetchFixturesByMonth({ month, seasonId, divisionId }),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 60,
    enabled: !!month && !!seasonId && !!divisionId,
    keepPreviousData: true,
  });
};
