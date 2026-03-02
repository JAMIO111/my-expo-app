import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const usePlayersByDistrict = (districtId) => {
  return useQuery({
    queryKey: ['Players', districtId],
    enabled: !!districtId,
    staleTime: 5 * 60 * 1000,

    queryFn: async () => {
      const { data, error } = await supabase
        .from('TeamPlayers')
        .select(
          `
          player_id,
          season_id,
          team:Teams (
            id,
            name,
            division:Divisions (
              id,
              name,
              district
            )
          ),
          season:Seasons (
            id,
            name,
            start_date,
            end_date
          ),
          player:Players!TeamPlayers_player_id_fkey (
            id,
            first_name,
            surname,
            nickname,
            avatar_url,
            current_frame_win_streak,
            best_frame_win_streak,
            current_match_win_streak,
            best_match_win_streak,
            xp,
            dob
          )
        `
        )
        .eq('team.division.district', districtId);

      if (error) throw new Error(error.message);

      // --- GROUP BY PLAYER ---
      const playersMap = new Map();

      data.forEach((entry) => {
        const playerId = entry.player.id;

        if (!playersMap.has(playerId)) {
          playersMap.set(playerId, {
            ...entry.player,
            seasons: [],
          });
        }

        playersMap.get(playerId).seasons.push({
          season: entry.season,
          team: entry.team,
        });
      });

      return Array.from(playersMap.values());
    },
  });
};
