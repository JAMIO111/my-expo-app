import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useStandings(divisionId, seasonId) {
  const query = useQuery({
    queryKey: ['Standings', divisionId, seasonId],
    queryFn: async () => {
      if (!divisionId || !seasonId) throw new Error('divisionId and seasonId is required');

      const [
        { data: seasonDivisionData, error: seasonDivisionError },
        { data: standings, error: standingsError },
      ] = await Promise.all([
        supabase.from('SeasonDivisions').select('*').eq('division', divisionId).single(),
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
          id: seasonDivisionData?.division,
          name: seasonDivisionData?.division_name,
          promotion_spots: seasonDivisionData?.promotion_spots,
          relegation_spots: seasonDivisionData?.relegation_spots,
          special_match: seasonDivisionData?.special_match,
          draws_allowed: seasonDivisionData?.draws_allowed,
        },
        standings,
      };
    },
    enabled: !!divisionId && !!seasonId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return query;
}
