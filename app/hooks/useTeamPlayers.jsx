import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useTeamPlayers(teamId) {
  return useQuery({
    queryKey: ['TeamPlayers', teamId],
    queryFn: async () => {
      if (!teamId) throw new Error('teamId is required');

      const { data, error } = await supabase.from('Players').select('*').eq('team_id', teamId);

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
