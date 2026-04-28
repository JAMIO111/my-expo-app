import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCompetitions({ districtId, divisionId, competitionType } = {}) {
  return useQuery({
    queryKey: ['Competitions', { districtId, divisionId, competitionType }],
    queryFn: async () => {
      let query = supabase.from('Competitions').select('*');

      if (districtId) {
        query = query.eq('district_id', districtId);
      }

      if (divisionId) {
        query = query.eq('division_id', divisionId);
      }

      if (competitionType) {
        query = query.eq('competition_type', competitionType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    enabled: !!(districtId || divisionId || competitionType), // prevents useless calls
  });
}
