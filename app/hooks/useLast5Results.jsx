import { useQuery } from '@tanstack/react-query';
import { supabase } from '@lib/supabaseClient'; // your Supabase client

export const useLast5Results = (teamId) => {
  return useQuery({
    queryKey: ['last5Results', teamId],
    queryFn: async () => {
      if (!teamId) return null;

      const { data, error } = await supabase.rpc('get_last_5_results', { team_id: teamId });

      if (error) {
        throw new Error(error.message);
      }

      return data; // ['W', 'L', 'D', 'W', 'W']
    },
    enabled: !!teamId, // avoid running query when teamId is not yet ready
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60, // 1 hour
  });
};
