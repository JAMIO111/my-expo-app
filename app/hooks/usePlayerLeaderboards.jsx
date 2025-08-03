import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export const usePlayerLeaderboards = (districtId) => {
  const { client: supabase } = useSupabaseClient();

  return useQuery({
    queryKey: ['playerLeaderboards', districtId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('TeamPlayers')
        .select(
          `
      player_id,
      team:Teams (
        id,
        division:Divisions (
          district
        )
      ),
      player:Players (
        id,
        first_name,
        surname,
        nickname,
        avatar_url,
        current_frame_win_streak,
        best_frame_win_streak,
        current_match_win_streak,
        best_match_win_streak,
        PlayerStats (
          frames_played,
          frames_won,
          frames_drawn,
          frames_lost,
          matches_played,
          matches_won,
          matches_drawn,
          matches_lost
        )
      )
    `
        )
        .filter('team.division.district', 'eq', districtId);

      if (error) throw new Error(error.message);

      // Deduplicate players by player_id
      const playerMap = new Map();

      for (const entry of data) {
        if (!playerMap.has(entry.player_id)) {
          playerMap.set(entry.player_id, {
            ...entry.player,
            stats: entry.player?.PlayerStats?.[0] || null,
            frame_win_percent: entry.player?.PlayerStats?.[0]
              ? `${((entry.player.PlayerStats[0].frames_won / entry.player.PlayerStats[0].frames_played) * 100).toFixed(1)}%`
              : '0.0%',
            player_id: entry.player_id,
          });
        }
      }

      return Array.from(playerMap.values());
    },
    enabled: !!districtId,
    staleTime: 5 * 60 * 1000,
  });
};
