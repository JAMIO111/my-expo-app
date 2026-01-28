import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export function usePlayerAwards(playerId) {
  const { client: supabase } = useSupabaseClient();

  return useQuery({
    queryKey: ['PlayerAwards', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_awards_with_details')
        .select('*')
        .eq('player_id', playerId);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    enabled: !!playerId,
  });
}
