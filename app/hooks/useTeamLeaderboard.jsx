import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTeamLeaderboard(districtId) {
  return useQuery({
    queryKey: ['TeamLeaderboard', districtId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_leaderboard', {
        _district_id: districtId,
      });

      if (error) {
        console.error('Team Leaderboard RPC Error:', error.message);
        throw error;
      }

      console.log('Team Leaderboard RPC DATA:', data);
      return data || [];
    },
    enabled: !!districtId,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
