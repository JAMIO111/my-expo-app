import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export function useSeasons(districtId) {
  const { client: supabase } = useSupabaseClient();
  return useQuery({
    queryKey: ['Seasons', districtId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Seasons')
        .select('*')
        .eq('district', districtId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}
