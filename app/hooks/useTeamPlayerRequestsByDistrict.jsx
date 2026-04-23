import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTeamPlayerRequestsByDistrict(districtId) {
  return useQuery({
    queryKey: ['TeamPlayerRequests', districtId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_player_requests_by_district', {
        p_district_id: districtId,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!districtId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
