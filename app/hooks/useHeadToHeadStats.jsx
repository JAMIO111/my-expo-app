import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useHeadToHeadStats = (homeTeamId, awayTeamId) => {
  return useQuery({
    queryKey: ['headToHeadStats', homeTeamId, awayTeamId],
    queryFn: async () => {
      if (!homeTeamId || !awayTeamId) return null;

      const { data, error } = await supabase.rpc('get_head_to_head_stats', {
        _team1_id: homeTeamId,
        _team2_id: awayTeamId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!homeTeamId && !!awayTeamId, // avoid running query when teamId is not yet ready
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60, // 1 hour
  });
};
