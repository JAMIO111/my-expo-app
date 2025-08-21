import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export function usePlayerInvitesAndRequests({ teamId, playerId }) {
  const { client: supabase } = useSupabaseClient();

  return useQuery({
    queryKey: ['PlayerInvitesAndRequests', { teamId, playerId }],
    queryFn: async () => {
      if (!teamId && !playerId) throw new Error('teamId or playerId is required');

      let query = supabase
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
            xp
          ),
          requested_by_player:requested_by (
            id,
            first_name,
            surname
          ),
          team:team_id (
            id,
            display_name,
            crest,
            abbreviation
          )
        `
        )
        .in('status', ['invited', 'requested']); // simpler than .or

      if (teamId) query = query.eq('team_id', teamId);
      if (playerId) query = query.eq('player_id', playerId);

      const { data, error } = await query;
      if (error) throw error;

      // Flatten nested fields for easier consumption
      return data.map(({ players, requested_by_player, team, ...teamPlayer }) => ({
        ...teamPlayer,
        player: players,
        requested_by_player,
        team,
      }));
    },
    enabled: !!teamId || !!playerId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}
