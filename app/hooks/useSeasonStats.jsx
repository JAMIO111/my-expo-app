import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useSeasonStats = (teamId, seasonId) => {
  return useQuery({
    queryKey: ['seasonStats', teamId, seasonId],
    queryFn: async () => {
      if (!teamId || !seasonId) return null;

      const { data, error } = await supabase.rpc('get_season_stats', {
        _team_id: teamId,
        _season_id: seasonId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!teamId && !!seasonId, // avoid running query when teamId or seasonId is not yet ready
  });
};
