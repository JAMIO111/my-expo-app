import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function useTeamPlayers(teamId) {
  return useQuery({
    queryKey: ['TeamPlayers', teamId],
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
        .eq('team_id', teamId);

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
