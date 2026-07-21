import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useAdminsByDistrict(districtId) {
  return useQuery({
    queryKey: ['Admins', districtId],
    queryFn: async () => {
      let query = supabase
        .from('DistrictAdmins')
        .select('*, Players(*)')
        .eq('district_id', districtId);

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export default useAdminsByDistrict;
