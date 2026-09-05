import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useTeamsRecruiting = (districtId) => {
  const fetchTeamsRecruiting = async (districtId) => {
    if (!districtId) throw new Error('District ID is required');

    const { data, error } = await supabase.rpc('get_teams_recruiting', {
      p_district_id: districtId,
    });

    if (error) {
      throw new Error(error.message);
    }
    return data;
  };

  return useQuery({
    queryKey: ['teams-recruiting', districtId],
    queryFn: () => fetchTeamsRecruiting(districtId),
    enabled: !!districtId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};

export default useTeamsRecruiting;
