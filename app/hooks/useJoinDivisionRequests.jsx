import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useJoinDivisionRequests({ districtId }) {
  return useQuery({
    queryKey: ['DivisionJoinRequests', districtId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_join_division_requests', {
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
