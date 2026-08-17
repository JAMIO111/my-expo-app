import { useQuery } from '@tanstack/react-query';
import { supabase } from '@lib/supabase';

export const usePlayerRankings = ({ districtId = null, divisionId = null } = {}) => {
  return useQuery({
    queryKey: ['player-rankings', districtId, divisionId],

    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard_players', {
        p_district_id: districtId,
        p_division_id: divisionId,
      });

      if (error) {
        console.error('get_leaderboard_players error:', error);
        throw error;
      }

      return data;
    },
    staleTime: 15 * 60 * 1000, // 5 minutes
    gCTime: 60 * 60 * 1000, // 1 hour
  });
};
