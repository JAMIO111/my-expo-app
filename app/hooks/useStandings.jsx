import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useStandings(divisionId, seasonId) {
  return useQuery({
    queryKey: ['Standings', divisionId, seasonId],
    queryFn: async () => {
      if (!divisionId || !seasonId) throw new Error('divisionId and seasonId is required');

      const [
        { data: seasonDivisionData, error: seasonDivisionError },
        { data: standings, error: standingsError },
      ] = await Promise.all([
        supabase
          .from('SeasonDivisions')
          .select('*, Divisions(id, name)')
          .eq('division', divisionId)
          .single(),
        supabase
          .from('Standings')
          .select('*, Teams(id, display_name, crest)')
          .eq('division', divisionId)
          .order('position', { ascending: true }),
      ]);

      if (seasonDivisionError) throw seasonDivisionError;
      if (standingsError) throw standingsError;

      return {
        division: {
          id: seasonDivisionData?.Divisions?.id,
          name: seasonDivisionData?.Divisions?.name,
          promotion_spots: seasonDivisionData?.promotion_spots,
          relegation_spots: seasonDivisionData?.relegation_spots,
        },
        standings,
      };
    },
    enabled: !!divisionId && !!seasonId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}
