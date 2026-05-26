import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTeamAwards(teamId) {
  return useQuery({
    queryKey: ['TeamAwards', teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_awards', { _team_id: teamId });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!teamId,
  });
}

export default useTeamAwards;
