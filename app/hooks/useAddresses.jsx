import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useAddresses(districtId) {
  return useQuery({
    queryKey: ['Addresses', districtId],
    queryFn: async () => {
      let query = supabase.from('Addresses').select('*').eq('district_id', districtId);

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export default useAddresses;
