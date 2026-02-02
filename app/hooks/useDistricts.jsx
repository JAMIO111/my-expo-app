import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useDistricts(includePrivate = false) {
  return useQuery({
    queryKey: ['Districts', includePrivate],
    queryFn: async () => {
      let query = supabase.from('Districts').select('*');

      if (!includePrivate) {
        query = query.eq('private', false);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}
