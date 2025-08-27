import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import Toast from 'react-native-toast-message';
import { useUser } from '@contexts/UserProvider';

export function useTeamPlayerActions(teamId, callbacks = {}) {
  const queryClient = useQueryClient();
  const { client: supabase } = useSupabaseClient();
  const { player, refetch } = useUser();

  // Helper to merge default + custom callbacks
  const handleCallbacks = (defaultFn, customFn) => (arg) => {
    defaultFn?.(arg);
    customFn?.(arg);
  };

  // 🚀 Remove player
  const removePlayer = useMutation({
    mutationFn: async ({ teamId, playerId }) => {
      const { error } = await supabase
        .from('TeamPlayers')
        .update({ status: 'left', left_at: new Date() })
        .eq('team_id', teamId)
        .eq('player_id', playerId)
        .eq('status', 'active');

      if (error) throw error;
      return playerId;
    },
    onSuccess: handleCallbacks((playerId) => {
      queryClient.invalidateQueries({ queryKey: ['TeamPlayers', teamId] });
      Toast.show({ type: 'success', text1: 'Player removed successfully' });
      console.log('Removed:', playerId);
    }, callbacks.removePlayer?.onSuccess),
    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to remove player' });
      console.log('Failed to remove player:', error);
    }, callbacks.removePlayer?.onError),
  });

  // 🚀 Promote player to captain
  const promoteToCaptain = useMutation({
    mutationFn: async (playerId) => {
      const { error } = await supabase.from('Teams').update({ captain: playerId }).eq('id', teamId);
      if (error) throw error;
      return playerId;
    },
    onSuccess: handleCallbacks((playerId) => {
      queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
      Toast.show({ type: 'success', text1: 'Player promoted to captain' });
      console.log('Promoted:', playerId);
    }, callbacks.promoteToCaptain?.onSuccess),
    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to promote player' });
      console.log('Failed to promote player:', error);
    }, callbacks.promoteToCaptain?.onError),
  });

  const acceptRequest = useMutation({
    mutationFn: async (playerId) => {
      const { error } = await supabase
        .from('TeamPlayers')
        .update({ status: 'active', joined_at: new Date(), accepted_by: player.id })
        .eq('team_id', teamId)
        .eq('player_id', playerId)
        .eq('status', 'requested');

      if (error) throw error;
      return playerId;
    },
    onSuccess: handleCallbacks((playerId) => {
      queryClient.invalidateQueries({ queryKey: ['TeamPlayers', teamId] });
      queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests', { teamId }] });
      Toast.show({ type: 'success', text1: 'Player join request accepted' });
      console.log('Accepted:', playerId);
    }, callbacks.acceptRequest?.onSuccess),
    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to accept player join request' });
      console.log('Failed to accept player join request:', error);
    }, callbacks.acceptRequest?.onError),
  });

  const denyRequest = useMutation({
    mutationFn: async (playerId) => {
      const { error } = await supabase
        .from('TeamPlayers')
        .delete()
        .eq('team_id', teamId)
        .eq('player_id', playerId)
        .eq('status', 'requested');

      if (error) throw error;
      return playerId;
    },
    onSuccess: handleCallbacks((playerId) => {
      queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests', { teamId }] });
      Toast.show({ type: 'success', text1: 'Player join request denied' });
      console.log('Denied:', playerId);
    }, callbacks.denyRequest?.onSuccess),
    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to deny player join request' });
      console.log('Failed to deny player join request:', error);
    }, callbacks.denyRequest?.onError),
  });

  const revokeInvite = useMutation({
    mutationFn: async (playerId) => {
      const { error } = await supabase
        .from('TeamPlayers')
        .delete()
        .eq('team_id', teamId)
        .eq('player_id', playerId)
        .eq('status', 'invited');

      if (error) throw error;
      return playerId;
    },
    onSuccess: handleCallbacks((playerId) => {
      queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests', { teamId }] });
      Toast.show({ type: 'success', text1: 'Player invite revoked' });
      console.log('Revoked:', playerId);
    }, callbacks.revokeInvite?.onSuccess),
    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to revoke player invite' });
      console.log('Failed to revoke player invite:', error);
    }, callbacks.revokeInvite?.onError),
  });

  const revokeRequest = useMutation({
    mutationFn: async (requestId) => {
      const { error } = await supabase
        .from('TeamPlayers')
        .delete()
        .eq('id', requestId)
        .eq('status', 'requested');

      if (error) throw error;
      return requestId;
    },
    onSuccess: handleCallbacks((requestId) => {
      queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests', { teamId }] });
      Toast.show({ type: 'info', text1: 'Request successfully revoked' });
      console.log('Revoked:', requestId);
    }, callbacks.revokeRequest?.onSuccess),
    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to revoke join team request' });
      console.log('Failed to revoke join team request:', error);
    }, callbacks.revokeRequest?.onError),
  });

  const leaveTeam = useMutation({
    mutationFn: async ({ team, player }) => {
      const { error } = await supabase
        .from('TeamPlayers')
        .update({ status: 'left', left_at: new Date() })
        .eq('team_id', team.id)
        .eq('player_id', player.id)
        .eq('status', 'active');

      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['TeamPlayers', variables.team.id] });
      refetch();
      Toast.show({
        type: 'success',
        text1: 'Left team',
        text2: `You have left ${variables.team.display_name}`,
      });
      console.log('Left team');
      callbacks.leaveTeam?.onSuccess?.(data, variables);
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: 'Failed to leave team' });
      console.log('Failed to leave team:', error);
      callbacks.leaveTeam?.onError?.(error);
    },
  });

  const sendJoinRequest = useMutation({
    mutationFn: async (teamId) => {
      const { error } = await supabase.from('TeamPlayers').insert({
        team_id: teamId,
        player_id: player.id,
        status: 'requested',
        requested_at: new Date(),
        requested_by: player.id,
      });

      if (error) throw error;
      return teamId;
    },
    onSuccess: handleCallbacks((teamId) => {
      queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests', { teamId }] });
      Toast.show({ type: 'success', text1: 'Join request sent' });
      console.log('Join request sent for team:', teamId);
    }, callbacks.sendJoinRequest?.onSuccess),
    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to send join request' });
      console.log('Failed to send join request:', error);
    }, callbacks.sendJoinRequest?.onError),
  });

  return {
    removePlayer,
    promoteToCaptain,
    acceptRequest,
    denyRequest,
    revokeInvite,
    leaveTeam,
    sendJoinRequest,
    revokeRequest,
  };
}
