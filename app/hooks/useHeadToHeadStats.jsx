import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useHeadToHeadStats = (homeCompetitorId, awayCompetitorId) => {
  return useQuery({
    queryKey: ['headToHeadStats', homeCompetitorId, awayCompetitorId],
    queryFn: async () => {
      if (!homeCompetitorId || !awayCompetitorId) return null;

      const { data, error } = await supabase.rpc('get_head_to_head_stats', {
        _home_competitor_id: homeCompetitorId,
        _away_competitor_id: awayCompetitorId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!homeCompetitorId && !!awayCompetitorId, // avoid running query when teamId is not yet ready
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60, // 1 hour
  });
};
