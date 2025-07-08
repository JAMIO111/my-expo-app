import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useDistricts() {
  return useQuery({
    queryKey: ['Districts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Districts')
        .select('*')
        .eq('private', false)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}
