import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const safe = (v) => Number(v) || 0;

const percent = (won, played) => (played > 0 ? Math.round((won / played) * 10000) / 100 : 0);

export function usePlayerStats(playerId) {
  return useQuery({
    queryKey: ['PlayerStats', playerId],
    queryFn: async () => {
      if (!playerId) throw new Error('Missing playerId');

      const { data: statsData, error: statsError } = await supabase
        .from('TeamPlayers')
        .select('*')
        .eq('player_id', playerId);

      if (statsError) throw statsError;

      const rows = statsData.map((row) => {
        // Base frame stats
        const homeFramesWon = safe(row.home_frames_won);
        const homeFramesLost = safe(row.home_frames_lost);
        const homeFramesDrawn = safe(row.home_frames_drawn);

        const awayFramesWon = safe(row.away_frames_won);
        const awayFramesLost = safe(row.away_frames_lost);
        const awayFramesDrawn = safe(row.away_frames_drawn);

        const homeFramesPlayed = homeFramesWon + homeFramesLost + homeFramesDrawn;
        const awayFramesPlayed = awayFramesWon + awayFramesLost + awayFramesDrawn;
        const framesPlayed = homeFramesPlayed + awayFramesPlayed;

        const framesWon = homeFramesWon + awayFramesWon;
        const framesLost = homeFramesLost + awayFramesLost;
        const framesDrawn = homeFramesDrawn + awayFramesDrawn;

        // Base match stats
        const homeMatchesWon = safe(row.home_matches_won);
        const homeMatchesLost = safe(row.home_matches_lost);
        const homeMatchesDrawn = safe(row.home_matches_drawn);

        const awayMatchesWon = safe(row.away_matches_won);
        const awayMatchesLost = safe(row.away_matches_lost);
        const awayMatchesDrawn = safe(row.away_matches_drawn);

        const homeMatchesPlayed = homeMatchesWon + homeMatchesLost + homeMatchesDrawn;
        const awayMatchesPlayed = awayMatchesWon + awayMatchesLost + awayMatchesDrawn;
        const matchesPlayed = homeMatchesPlayed + awayMatchesPlayed;

        const matchesWon = homeMatchesWon + awayMatchesWon;
        const matchesLost = homeMatchesLost + awayMatchesLost;
        const matchesDrawn = homeMatchesDrawn + awayMatchesDrawn;

        return {
          ...row,

          // Frame totals
          frames_played: framesPlayed,
          frames_won: framesWon,
          frames_drawn: framesDrawn,
          frames_lost: framesLost,

          home_frames_played: homeFramesPlayed,
          away_frames_played: awayFramesPlayed,

          home_frames_won: homeFramesWon,
          home_frames_drawn: homeFramesDrawn,
          home_frames_lost: homeFramesLost,

          away_frames_won: awayFramesWon,
          away_frames_drawn: awayFramesDrawn,
          away_frames_lost: awayFramesLost,

          frame_win_percent: percent(framesWon, framesPlayed),
          home_frame_win_percent: percent(homeFramesWon, homeFramesPlayed),
          away_frame_win_percent: percent(awayFramesWon, awayFramesPlayed),

          // Match totals
          matches_played: matchesPlayed,
          matches_won: matchesWon,
          matches_drawn: matchesDrawn,
          matches_lost: matchesLost,

          home_matches_played: homeMatchesPlayed,
          away_matches_played: awayMatchesPlayed,

          home_matches_won: homeMatchesWon,
          home_matches_drawn: homeMatchesDrawn,
          home_matches_lost: homeMatchesLost,

          away_matches_won: awayMatchesWon,
          away_matches_drawn: awayMatchesDrawn,
          away_matches_lost: awayMatchesLost,

          match_win_percent: percent(matchesWon, matchesPlayed),
          home_match_win_percent: percent(homeMatchesWon, homeMatchesPlayed),
          away_match_win_percent: percent(awayMatchesWon, awayMatchesPlayed),
        };
      });

      // Aggregate everything deterministically
      const total = rows.reduce(
        (acc, curr) => {
          Object.keys(acc).forEach((key) => {
            acc[key] += curr[key] || 0;
          });
          return acc;
        },
        {
          frames_played: 0,
          frames_won: 0,
          frames_drawn: 0,
          frames_lost: 0,

          home_frames_played: 0,
          away_frames_played: 0,

          home_frames_won: 0,
          home_frames_drawn: 0,
          home_frames_lost: 0,

          away_frames_won: 0,
          away_frames_drawn: 0,
          away_frames_lost: 0,

          matches_played: 0,
          matches_won: 0,
          matches_drawn: 0,
          matches_lost: 0,

          home_matches_played: 0,
          away_matches_played: 0,

          home_matches_won: 0,
          home_matches_drawn: 0,
          home_matches_lost: 0,

          away_matches_won: 0,
          away_matches_drawn: 0,
          away_matches_lost: 0,
        }
      );

      // Recompute derived totals from base totals
      const totalStats = {
        ...total,
        frame_win_percent: percent(total.frames_won, total.frames_played),
        home_frame_win_percent: percent(total.home_frames_won, total.home_frames_played),
        away_frame_win_percent: percent(total.away_frames_won, total.away_frames_played),
        match_win_percent: percent(total.matches_won, total.matches_played),
        home_match_win_percent: percent(total.home_matches_won, total.home_matches_played),
        away_match_win_percent: percent(total.away_matches_won, total.away_matches_played),
      };

      // Player meta
      const { data: playerData, error: playerError } = await supabase
        .from('Players')
        .select(
          'xp, current_frame_win_streak, best_frame_win_streak, current_match_win_streak, best_match_win_streak, displayed_stats'
        )
        .eq('id', playerId)
        .single();

      if (playerError) throw playerError;

      return {
        statsBySeasonDivision: rows,
        totalStats,
        playerMeta: {
          xp: safe(playerData?.xp),
          current_frame_win_streak: safe(playerData?.current_frame_win_streak),
          best_frame_win_streak: safe(playerData?.best_frame_win_streak),
          current_match_win_streak: safe(playerData?.current_match_win_streak),
          best_match_win_streak: safe(playerData?.best_match_win_streak),
          displayed_stats: playerData?.displayed_stats,
        },
      };
    },
    enabled: !!playerId,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  });
}
