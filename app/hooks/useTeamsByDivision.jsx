import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useTeamsByDivision = (divisionId) => {
  const fetchTeamsByDivision = async (divisionId) => {
    if (!divisionId) throw new Error('Division ID is required');

    const { data, error } = await supabase
      .from('Teams')
      .select('*')
      .eq('division', divisionId)
      .order('display_name', { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    return data;
  };

  return useQuery({
    queryKey: ['teams', divisionId],
    queryFn: () => fetchTeamsByDivision(divisionId),
    enabled: !!divisionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
