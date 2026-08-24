import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRecentBadges(playerId) {
  return useQuery({
    queryKey: ['recent-badges', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BadgesUnlocked')
        .select('*, Badges(key)')
        .eq('player_id', playerId)
        .order('unlocked_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!playerId, // only run query if playerId is provided
  });
}

export default useRecentBadges;
