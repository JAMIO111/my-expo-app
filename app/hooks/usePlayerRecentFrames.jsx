import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const RECENT_FRAMES_LIMIT = 5;

export function usePlayerRecentFrames(playerId) {
  const query = useQuery({
    queryKey: ['player-frames-recent', playerId],

    enabled: !!playerId,

    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_frames', {
        _player_id: playerId,
        _limit: RECENT_FRAMES_LIMIT,
        _before_date_time: null,
        _before_fixture_id: null,
        _before_frame_number: null,
      });

      if (error) throw error;

      return data ?? { frames: [], players: [] };
    },

    staleTime: 30_000,
  });

  const frames = useMemo(() => query.data?.frames ?? [], [query.data]);

  const playersById = useMemo(
    () => new Map((query.data?.players ?? []).map((p) => [p.id, p])),
    [query.data]
  );

  return { ...query, frames, playersById };
}

export default usePlayerRecentFrames;
