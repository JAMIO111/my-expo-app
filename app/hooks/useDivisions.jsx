import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export function useDivisions(districtId) {
  const { client: supabase } = useSupabaseClient();

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
    enabled: !!districtId, // only run query if districtId is provided
  });
}
