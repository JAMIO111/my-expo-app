import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCompetitions(districtId) {
  return useQuery({
    queryKey: ['Competitions', districtId],
    queryFn: async () => {
      // Supabase allows selecting related tables using foreign key relationships
      const { data, error } = await supabase
        .from('Competitions')
        .select('*')
        .eq('district_id', districtId);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    enabled: !!districtId, // only run query if districtId is provided
  });
}
