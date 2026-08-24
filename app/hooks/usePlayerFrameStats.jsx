import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Helper to handle division by zero and rounding
const getWinRate = (won, played) => {
  if (!played || played === 0) return 0;
  return Math.round((won / played) * 100);
};

export function usePlayerFrameStats(playerId, side, frameType) {
  return useQuery({
    queryKey: ['PlayerFrameStats', playerId, side, frameType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_frame_stats', {
        _player_id: playerId,
        _side: side,
        _frame_type: frameType,
      });

      console.log('usePlayerFrameStats raw data:', data);

      if (error) throw error;
      return data;
    },
    // Use 'select' to transform the data after it's fetched
    select: (data) => {
      if (!data) return null;

      return {
        ...data,
        totalStats,
        statsBySeasonDivision,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!playerId,
  });
}

export default usePlayerFrameStats;
