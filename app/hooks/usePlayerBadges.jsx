import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const usePlayerBadges = (playerId, currentSeasonId) => {
  const {
    data: badges,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['PlayerBadges', playerId, currentSeasonId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_badges', {
        p_player_id: playerId,
        p_season_id: currentSeasonId,
      });

      if (error) throw error;

      return data || [];
    },
    enabled: !!playerId && !!currentSeasonId,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return { badges: badges || [], isLoading, error };
};

export default usePlayerBadges;
