import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export const useTeamLeaderboards = (districtId) => {
  const { client: supabase } = useSupabaseClient();

  return useQuery({
    queryKey: ['teamLeaderboards', districtId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Teams')
        .select(
          `
          id,
          display_name,
          crest,
          current_frame_win_streak,
          best_frame_win_streak,
          current_match_win_streak,
          best_match_win_streak,
          division:Divisions (
            district
          ),
          TeamStats (
          frames_played,
            frames_won,
            frames_drawn,
            frames_lost,
            matches_played,
            matches_won,
            matches_drawn,
            matches_lost
          )
        `
        )
        .filter('division.district', 'eq', districtId);

      if (error) throw new Error(error.message);

      return data.map((team) => {
        const stats = team.TeamStats?.[0] || null;
        const matchWinPercent =
          stats && stats.matches_played > 0
            ? ((stats.matches_won / stats.matches_played) * 100).toFixed(1) + '%'
            : '0.0%';

        return {
          id: team.id,
          display_name: team.display_name,
          crest: {
            type: team.crest?.type,
            color1: team.crest?.color1,
            color2: team.crest?.color2,
            thickness: team.crest?.thickness,
          },
          stats,
          match_win_percent: matchWinPercent,
        };
      });
    },
    enabled: !!districtId,
    staleTime: 5 * 60 * 1000,
  });
};
