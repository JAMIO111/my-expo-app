import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useHeadToHeadStats = (homeCompetitorId, awayCompetitorId, competitorType) => {
  return useQuery({
    queryKey: ['headToHeadStats', competitorType, homeCompetitorId, awayCompetitorId],

    queryFn: async () => {
      if (!homeCompetitorId || !awayCompetitorId || !competitorType) {
        return null;
      }

      const rpcName =
        competitorType === 'team' ? 'get_team_head_to_head' : 'get_individual_head_to_head';

      const params =
        competitorType === 'team'
          ? {
              _team_a: homeCompetitorId,
              _team_b: awayCompetitorId,
            }
          : {
              _player_a: homeCompetitorId,
              _player_b: awayCompetitorId,
            };

      console.log('Calling RPC with params:', { rpcName, params });

      const { data, error } = await supabase.rpc(rpcName, params);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },

    enabled: !!homeCompetitorId && !!awayCompetitorId && !!competitorType,

    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60,
  });
};

export default useHeadToHeadStats;
