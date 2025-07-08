import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useSeasons(districtId) {
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
