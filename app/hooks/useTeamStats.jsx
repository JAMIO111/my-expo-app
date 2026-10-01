import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Helper to handle division by zero and rounding
const getWinRate = (won, played) => {
  if (!played || played === 0) return 0;

  const value = (won / played) * 100;
  const rounded = Math.round(value * 10) / 10;

  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

export function useTeamStats(teamId) {
  return useQuery({
    queryKey: ['TeamStats', teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_stats', {
        _team_id: teamId,
      });

      if (error) console.error('Team Stats RPC Error:', error.message);
      return data;
    },
    // Use 'select' to transform the data after it's fetched
    select: (data) => {
      if (!data) return null;

      // No approved frames yet => the RPC returns no totalStats at all.
      const totals = data.totalStats ?? {};

      // 1. Calculate for Total Stats
      const totalStats = {
        ...totals,
        match_win_percent: getWinRate(totals.matches_won, totals.matches_played),
        frame_win_percent: getWinRate(totals.frames_won, totals.frames_played),
        home_match_win_percent: getWinRate(totals.home_matches_won, totals.home_matches_played),
        away_match_win_percent: getWinRate(totals.away_matches_won, totals.away_matches_played),
        home_frame_win_percent: getWinRate(totals.home_frames_won, totals.home_frames_played),
        away_frame_win_percent: getWinRate(totals.away_frames_won, totals.away_frames_played),
      };

      // 2. Calculate for each Season/Division entry
      const statsBySeasonDivision =
        data.statsBySeasonDivision?.map((season) => ({
          ...season,
          match_win_percent: getWinRate(season.matches_won, season.matches_played),
          frame_win_percent: getWinRate(season.frames_won, season.frames_played),
          home_match_win_percent: getWinRate(season.home_matches_won, season.home_matches_played),
          away_match_win_percent: getWinRate(season.away_matches_won, season.away_matches_played),
          home_frame_win_percent: getWinRate(season.home_frames_won, season.home_frames_played),
          away_frame_win_percent: getWinRate(season.away_frames_won, season.away_frames_played),
        })) || [];

      return {
        ...data,
        totalStats,
        statsBySeasonDivision,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!teamId,
  });
}

export default useTeamStats;
