import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export default function useTeamPlayers(userId) {
  return useQuery({
    queryKey: ['PlayerProfile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');

      const { data, error } = await supabase
        .from('Players')
        .select(
          `
      *,
      Teams!Players_team_id_fkey (
        name, display_name
      )
    `
        )
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        ...data,
        team_name: data.Teams?.name ?? null,
        team_display_name: data.Teams?.display_name ?? null,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}
