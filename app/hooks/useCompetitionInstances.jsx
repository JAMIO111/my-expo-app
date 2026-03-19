import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCompetitionInstances(seasonId) {
  return useQuery({
    queryKey: ['CompetitionInstances', seasonId],
    queryFn: async () => {
      let query = supabase
        .from('CompetitionInstances')
        .select('*')
        .eq('season_id', seasonId)
        .eq('status', 'active');

      const { data, error } = await query.order('division_tier', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}
