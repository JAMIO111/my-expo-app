import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePlayerRecentFrames(playerId) {
  return useQuery({
    queryKey: ['player-frames-recent', playerId],

    enabled: !!playerId,

    queryFn: async () => {
      if (!playerId) {
        throw new Error('Player ID is required');
      }

      const { data, error } = await supabase.rpc('get_player_frames', {
        _player_id: playerId,
        _limit: 5,
        _before_date_time: null,
        _before_fixture_id: null,
        _before_frame_number: null,
      });

      if (error) {
        throw error;
      }

      return (
        data ?? {
          frames: [],
          players: [],
        }
      );
    },

    staleTime: 30_000,
  });
}

export default usePlayerRecentFrames;
