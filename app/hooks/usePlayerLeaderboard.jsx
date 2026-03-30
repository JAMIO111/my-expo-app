import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePlayerLeaderboard(districtId) {
  return useQuery({
    queryKey: ['PlayerLeaderboard', districtId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_leaderboard', {
        _district_id: districtId,
      });

      if (error) {
        console.error('Player Leaderboard RPC Error:', error.message);
        throw error;
      }

      console.log('Player Leaderboard RPC DATA:', data);
      return data || [];
    },
    enabled: !!districtId,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
