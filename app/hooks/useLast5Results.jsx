import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useLast5Results = (competitorId, competitorType, formType = 'matches') => {
  return useQuery({
    queryKey: ['last5Results', competitorId, competitorType, formType],
    queryFn: async () => {
      if (!competitorId) return [];

      const { data, error } = await supabase.rpc('get_last_5_results', {
        _competitor_id: competitorId, // Match the underscore names
        _competitor_type: competitorType,
        _form_type: formType,
      });

      if (error) {
        console.error('Form RPC Error:', error.message);
        throw error;
      }

      return data || [];
    },
    enabled: !!competitorId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    keepPreviousData: true,
  });
};
