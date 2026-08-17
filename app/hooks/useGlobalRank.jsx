import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase'; // adjust to your actual import path

export function useGlobalRank(playerId) {
  return useQuery({
    queryKey: ['globalRank', playerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_global_rank', {
        p_player_id: playerId,
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'UNEXPECTED_ERROR');
      }

      return {
        rank: data.rank,
        totalPlayers: data.total_players,
      };
    },
    enabled: !!playerId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
