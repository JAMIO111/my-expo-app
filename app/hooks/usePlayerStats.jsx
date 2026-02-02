import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePlayerStats(playerId) {
  return useQuery({
    queryKey: ['PlayerStats', playerId],
    queryFn: async () => {
      if (!playerId) throw new Error('Missing playerId');

      // Fetch PlayerStats rows (per season/division)
      const { data: statsData, error: statsError } = await supabase
        .from('PlayerStats')
        .select('*')
        .eq('player_id', playerId);

      if (statsError) throw statsError;

      const rows = statsData.map((row) => {
        const framesPlayed = row.frames_played || 0;
        const framesWon = row.frames_won || 0;
        const matchesPlayed = row.matches_played || 0;
        const matchesWon = row.matches_won || 0;

        return {
          ...row,
          frames_played: framesPlayed,
          frames_won: framesWon,
          frames_drawn: row.frames_drawn || 0,
          frames_lost: row.frames_lost || 0,
          matches_played: matchesPlayed,
          matches_won: matchesWon,
          matches_drawn: row.matches_drawn || 0,
          matches_lost: row.matches_lost || 0,
          frame_win_percent: framesPlayed > 0 ? (framesWon / framesPlayed) * 100 : 0,
          match_win_percent: matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0,
        };
      });

      // Aggregate totals
      const total = rows.reduce(
        (acc, curr) => {
          acc.frames_played += curr.frames_played;
          acc.frames_won += curr.frames_won;
          acc.frames_drawn += curr.frames_drawn;
          acc.frames_lost += curr.frames_lost;

          acc.matches_played += curr.matches_played;
          acc.matches_won += curr.matches_won;
          acc.matches_drawn += curr.matches_drawn;
          acc.matches_lost += curr.matches_lost;
          return acc;
        },
        {
          frames_played: 0,
          frames_won: 0,
          frames_drawn: 0,
          frames_lost: 0,
          matches_played: 0,
          matches_won: 0,
          matches_drawn: 0,
          matches_lost: 0,
        }
      );

      const totalFrameWinPercent =
        total.frames_played > 0 ? (total.frames_won / total.frames_played) * 100 : 0;
      const totalMatchWinPercent =
        total.matches_played > 0 ? (total.matches_won / total.matches_played) * 100 : 0;

      // Fetch player XP and streaks
      const { data: playerData, error: playerError } = await supabase
        .from('Players')
        .select(
          'xp, current_frame_win_streak, best_frame_win_streak, current_match_win_streak, best_match_win_streak'
        )
        .eq('id', playerId)
        .single();

      if (playerError) throw playerError;

      return {
        statsBySeasonDivision: rows,
        totalStats: {
          ...total,
          frame_win_percent: totalFrameWinPercent,
          match_win_percent: totalMatchWinPercent,
        },
        playerMeta: {
          xp: playerData.xp || 0,
          current_frame_win_streak: playerData.current_frame_win_streak || 0,
          best_frame_win_streak: playerData.best_frame_win_streak || 0,
          current_match_win_streak: playerData.current_match_win_streak || 0,
          best_match_win_streak: playerData.best_match_win_streak || 0,
        },
      };
    },
    enabled: !!playerId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
}
