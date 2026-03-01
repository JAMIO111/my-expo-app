import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useTeamStats(teamId) {
  return useQuery({
    queryKey: ['TeamStats', teamId],
    enabled: !!teamId,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,

    queryFn: async () => {
      if (!teamId) throw new Error('Missing teamId');

      const round = (num) => Number(num.toFixed(2));

      // Fetch season stats
      const { data: statsData, error: statsError } = await supabase
        .from('TeamStats')
        .select(
          `
          *,
          Seasons:season_id (
            id,
            name,
            start_date,
            end_date
          )
        `
        )
        .eq('team_id', teamId);

      if (statsError) throw statsError;

      const rows = (statsData || []).map((row) => {
        const framesPlayed = row.frames_played || 0;
        const framesWon = row.frames_won || 0;
        const matchesPlayed = row.matches_played || 0;
        const matchesWon = row.matches_won || 0;

        const avgFramesWonPerMatch = matchesPlayed > 0 ? framesWon / matchesPlayed : 0;

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
          frame_win_percent: framesPlayed > 0 ? round((framesWon / framesPlayed) * 100) : 0,
          match_win_percent: matchesPlayed > 0 ? round((matchesWon / matchesPlayed) * 100) : 0,
          avg_frames_won_per_match: round(avgFramesWonPerMatch),
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
        total.frames_played > 0 ? round((total.frames_won / total.frames_played) * 100) : 0;

      const totalMatchWinPercent =
        total.matches_played > 0 ? round((total.matches_won / total.matches_played) * 100) : 0;

      const totalAvgFramesWonPerMatch =
        total.matches_played > 0 ? round(total.frames_won / total.matches_played) : 0;

      // Fetch team meta
      const { data: teamData, error: teamError } = await supabase
        .from('Teams')
        .select(
          `
          crest,
          current_frame_win_streak,
          best_frame_win_streak,
          current_match_win_streak,
          best_match_win_streak
        `
        )
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      return {
        statsBySeasonDivision: rows,
        totalStats: {
          ...total,
          frame_win_percent: totalFrameWinPercent,
          match_win_percent: totalMatchWinPercent,
          avg_frames_won_per_match: totalAvgFramesWonPerMatch,
        },
        teamMeta: {
          crest: teamData?.crest ?? null,
          current_frame_win_streak: teamData?.current_frame_win_streak ?? 0,
          best_frame_win_streak: teamData?.best_frame_win_streak ?? 0,
          current_match_win_streak: teamData?.current_match_win_streak ?? 0,
          best_match_win_streak: teamData?.best_match_win_streak ?? 0,
        },
      };
    },
  });
}
