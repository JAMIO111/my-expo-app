import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCompetition(competitionId) {
  return useQuery({
    queryKey: ['Competition', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    enabled: !!competitionId, // only run query if competitionId is provided
  });
}
