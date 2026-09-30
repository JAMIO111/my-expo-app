import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Fixtures escalated to the league admin (a captain escalated them, or nobody acted
// within the district's result_escalation_days). Admin-only: the RPC checks the caller.
export function useEscalatedFixtures(districtId, enabled = true) {
  return useQuery({
    queryKey: ['EscalatedFixtures', districtId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_escalated_fixtures', {
        p_district_id: districtId,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: enabled && !!districtId,
    staleTime: 5 * 60 * 1000,
  });
}

export default useEscalatedFixtures;
