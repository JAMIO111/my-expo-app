import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useJoinTeamRequests({ districtId, teamId }) {
  return useQuery({
    queryKey: ['TeamPlayerRequests', districtId, teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_join_team_requests', {
        p_district_id: districtId,
        p_team_id: teamId,
      });

      if (error) throw error;

      return data;
    },
    enabled: !!districtId || !!teamId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
