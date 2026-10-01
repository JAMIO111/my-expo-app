import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// The table is worked out in the database (forfeits and walkovers count, leavers stay on the table).
export function useStandings(divisionId, seasonId) {
  return useQuery({
    queryKey: ['Standings', divisionId, seasonId],
    enabled: !!divisionId && !!seasonId,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_division_standings', {
        p_division_id: divisionId,
        p_season_id: seasonId,
      });
      if (error) throw error;
      return data;
    },
  });
}

export default useStandings;
