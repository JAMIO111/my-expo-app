import { useMutation } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

export function useRequestToJoinTeam(team, playerId, adminApproval = false) {
  const { client: supabase } = useSupabaseClient();

  return useMutation({
    mutationFn: async () => {
      if (!team?.id || !playerId) {
        throw new Error('Missing team or player');
      }

      const isPrivateTeam = !!team.private;
      const isAdminApprovalRequired = adminApproval;

      /**
       * Status rules:
       * - public + no admin approval → auto accepted
       * - private → pending_captain
       * - admin approval → pending_admin
       */
      let status = 'active';
      let joinedAt = new Date().toISOString();

      if (isAdminApprovalRequired && isPrivateTeam) {
        status = 'pending_both';
        joinedAt = null;
      } else if (isPrivateTeam && !isAdminApprovalRequired) {
        status = 'pending_captain';
        joinedAt = null;
      } else if (!isPrivateTeam && isAdminApprovalRequired) {
        status = 'pending_admin';
        joinedAt = null;
      }

      const { error } = await supabase.from('TeamPlayers').insert({
        team_id: team.id,
        player_id: playerId,
        season_id: team.season_id ?? null,

        role: 'player',
        status,

        requested_at: new Date().toISOString(),
        requested_by: playerId,
        accepted_by_captain: null,
        accepted_by_admin: null,
        accepted_at_captain: null,
        accepted_at_admin: null,

        joined_at: joinedAt,
        left_at: null,

        // stats default to zero
        home_frames_won: 0,
        home_frames_drawn: 0,
        home_frames_lost: 0,
        home_matches_won: 0,
        home_matches_drawn: 0,
        home_matches_lost: 0,
        away_frames_won: 0,
        away_frames_drawn: 0,
        away_frames_lost: 0,
        away_matches_won: 0,
      });

      if (error) {
        throw error;
      }

      return {
        status,
        requiresApproval: status !== 'accepted',
      };
    },
  });
}
