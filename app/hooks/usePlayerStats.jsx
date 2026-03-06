import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePlayerStats(playerId) {
  return useQuery({
    queryKey: ['PlayerStats', playerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_stats', { _player_id: playerId });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    enabled: !!playerId, // only run query if playerId is provided
  });
}
