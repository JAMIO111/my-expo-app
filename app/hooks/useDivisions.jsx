import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useDivisions(districtId) {
  return useQuery({
    queryKey: ['Divisions', districtId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Divisions')
        .select('*')
        .eq('district', districtId)
        .order('tier', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}
