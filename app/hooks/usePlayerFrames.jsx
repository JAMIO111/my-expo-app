import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export function usePlayerFrames(playerId) {
  const query = useInfiniteQuery({
    queryKey: ['player-frames', playerId],

    enabled: !!playerId,

    queryFn: async ({ pageParam }) => {
      if (!playerId) {
        throw new Error('Player ID is required');
      }

      const { data, error } = await supabase.rpc('get_player_frames', {
        _player_id: playerId,
        _limit: 10,
        _before_date_time: pageParam?.date_time ?? null,
        _before_fixture_id: pageParam?.fixture_id ?? null,
        _before_frame_number: pageParam?.frame_number ?? null,
      });

      console.log('RPC DATA:', JSON.stringify(data, null, 2));
      console.log('RPC ERROR:', error);

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

    getNextPageParam: (lastPage) => {
      const frames = lastPage?.frames ?? [];

      // If fewer than 30 frames were returned,
      // we've reached the end.
      if (frames.length < 10) {
        return undefined;
      }

      const lastFrame = frames[frames.length - 1];

      if (!lastFrame) {
        return undefined;
      }

      return {
        date_time: lastFrame.fixture_date_time,
        fixture_id: lastFrame.fixture_id,
        frame_number: lastFrame.frame_number,
      };
    },

    staleTime: 30_000,
  });

  /*
   * Combine all frames from all loaded pages
   */
  const frames = useMemo(() => {
    return query.data?.pages.flatMap((page) => page?.frames ?? []) ?? [];
  }, [query.data]);

  /*
   * Combine players from all loaded pages
   * and remove duplicates by player ID.
   */
  const players = useMemo(() => {
    const playerMap = new Map();

    query.data?.pages.forEach((page) => {
      page?.players?.forEach((player) => {
        if (player?.id) {
          playerMap.set(player.id, player);
        }
      });
    });

    return Array.from(playerMap.values());
  }, [query.data]);

  /*
   * Fast player lookup:
   *
   * playersById.get(playerId)
   */
  const playersById = useMemo(() => {
    return new Map(players.map((player) => [player.id, player]));
  }, [players]);

  return {
    // Raw TanStack Query state
    ...query,

    // Processed data
    frames,
    players,
    playersById,

    // Convenient aliases
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
  };
}
