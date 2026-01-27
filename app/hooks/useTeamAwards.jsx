import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export function useTeamAwards(teamId) {
  const { client: supabase } = useSupabaseClient();

  return useQuery({
    queryKey: ['TeamAwards', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_awards_with_details')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    enabled: !!teamId,
  });
}
