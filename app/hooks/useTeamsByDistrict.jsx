import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useTeamsByDistrict = (districtId) => {
  const fetchTeamsByDistrict = async (districtId) => {
    if (!districtId) throw new Error('District ID is required');

    const { data, error } = await supabase
      .from('Teams')
      .select('*, division(id, name)')
      .eq('district', districtId)
      .order('display_name', { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    return data;
  };

  return useQuery({
    queryKey: ['teams', districtId],
    queryFn: () => fetchTeamsByDistrict(districtId),
    enabled: !!districtId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
