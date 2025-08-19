import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export function usePlayerInvitesAndRequests(teamId) {
  const { client: supabase } = useSupabaseClient();
  return useQuery({
    queryKey: ['PlayerInvitesAndRequests', teamId],
    queryFn: async () => {
      if (!teamId) throw new Error('teamId is required');

      const { data, error } = await supabase
        .from('TeamPlayers')
        .select(
          `
          *,
          players:player_id (
            id,
            first_name,
            surname,
            nickname,
            avatar_url,
            xp,
            current_frame_win_streak,
            best_frame_win_streak
          )
        `
        )
        .eq('team_id', teamId)
        .or('status.eq.invited,status.eq.requested');

      if (error) throw error;

      // Flatten the result
      const flattened = data.map(({ players, ...teamPlayer }) => ({
        ...teamPlayer,
        ...players,
      }));

      return flattened;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}
