import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePlayerInvitesAndRequests({ teamId, playerId }) {
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
          accepted_by_captain:accepted_by_captain (
            id,
            first_name,
            surname
          ),
          accepted_by_admin:accepted_by_admin (
            id,
            first_name,
            surname
          ),
          invited_by:invited_by (
            id,
            first_name,
            surname
          ),
          team:team_id (
            id,
            display_name,
            crest,
            abbreviation,
            parent_team_id
          )
        `
        )
        .in('status', [
          'invited',
          'requested',
          'pending_both',
          'pending_captain',
          'pending_admin',
          'pending_player',
        ]);

      if (teamId) query = query.eq('team_id', teamId);
      if (playerId) query = query.eq('player_id', playerId);

      const { data, error } = await query;
      if (error) throw error;

      // Flatten player fields onto the top level, same shape as useTeamPlayers
      return data.map(({ players, requested_by_player, invited_by, team, ...teamPlayer }) => ({
        ...teamPlayer,
        ...players,
        requested_by_player,
        invited_by,
        context: 'team',
        type: invited_by ? 'invite' : 'request',
        team,
        team_player_id: teamPlayer.id, // Keep the original TeamPlayers id for reference
      }));
    },
    enabled: !!teamId || !!playerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export default usePlayerInvitesAndRequests;
