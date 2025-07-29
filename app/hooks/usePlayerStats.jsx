import { useQuery } from '@tanstack/react-query';
import supabase from '@lib/supabaseClient';

export function usePlayerStats(playerId) {
  return useQuery({
    queryKey: ['PlayerStats', playerId],
    queryFn: async () => {
      if (!playerId) throw new Error('Missing playerId');

      // Fetch PlayerStats
      const { data: statsData, error: statsError } = await supabase
        .from('PlayerStats')
        .select('*')
        .eq('player_id', playerId);

      if (statsError) throw statsError;

      // Map and normalize stats rows
      const rows = statsData.map((row) => {
        const played = row.frames_played || 0;
        const won = row.frames_won || 0;

        return {
          ...row,
          frames_played: played,
          frames_won: won,
          frames_drawn: row.frames_drawn || 0,
          frames_lost: row.frames_lost || 0,
          win_percent: played > 0 ? (won / played) * 100 : 0,
        };
      });

      // Calculate aggregate totals
      const total = rows.reduce(
        (acc, curr) => {
          acc.frames_played += curr.frames_played;
          acc.frames_won += curr.frames_won;
          acc.frames_drawn += curr.frames_drawn;
          acc.frames_lost += curr.frames_lost;
          return acc;
        },
        {
          frames_played: 0,
          frames_won: 0,
          frames_drawn: 0,
          frames_lost: 0,
        }
      );

      const win_percent =
        total.frames_played > 0 ? (total.frames_won / total.frames_played) * 100 : 0;

      // Fetch XP and streaks from Players table
      const { data: playerData, error: playerError } = await supabase
        .from('Players')
        .select('xp, current_win_streak, best_win_streak')
        .eq('id', playerId)
        .single();

      if (playerError) throw playerError;

      return {
        statsBySeasonDivision: rows,
        totalStats: {
          ...total,
          win_percent,
        },
        playerMeta: {
          xp: playerData.xp || 0,
          current_win_streak: playerData.current_win_streak || 0,
          best_win_streak: playerData.best_win_streak || 0,
        },
      };
    },
    enabled: !!playerId,
    staleTime: 30 * 60 * 1000, // 30 mins
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}
