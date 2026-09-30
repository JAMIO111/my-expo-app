import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useUser } from '@contexts/UserProvider';
import { assertRpcOk } from '@lib/rpc';

const PENDING_REQUEST = ['requested', 'pending_captain', 'pending_admin', 'pending_both'];
const PENDING_INVITE = ['invited', 'pending_player', 'pending_admin', 'pending_both'];

// The RPCs act on a TeamPlayers row id; the UI only knows team + player.
async function findTeamPlayerId(teamId, playerId, statuses) {
  const { data, error } = await supabase
    .from('TeamPlayers')
    .select('id')
    .eq('team_id', teamId)
    .eq('player_id', playerId)
    .in('status', statuses)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('This request is no longer pending');
  return data.id;
}

export function useTeamPlayerActions(teamId, callbacks = {}) {
  const queryClient = useQueryClient();

  const { player, refetch } = useUser();

  // Helper to merge default + custom callbacks
  const handleCallbacks = (defaultFn, customFn) => (arg) => {
    defaultFn?.(arg);
    customFn?.(arg);
  };

  // 🚀 Remove player
  const removePlayer = useMutation({
    mutationFn: async ({ teamId, playerId }) => {
      const { data, error } = await supabase.rpc('remove_team_player', {
        p_team_id: teamId,
        p_player_id: playerId,
      });
      assertRpcOk(data, error);
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
      // TeamPlayers.role is the source of truth; the RPC also notifies the team.
      const { error } = await supabase.rpc('transfer_captaincy', {
        p_team_id: teamId,
        p_new_captain_id: playerId,
      });
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
      const id = await findTeamPlayerId(teamId, playerId, PENDING_REQUEST);
      const { data, error } = await supabase.rpc('accept_player_join_team_request', {
        p_team_player_id: id,
      });
      assertRpcOk(data, error);
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

  const acceptInvite = useMutation({
    mutationFn: async (invite) => {
      const { data, error } = await supabase.rpc('accept_player_join_team_invite', {
        p_team_player_id: invite.id,
      });
      assertRpcOk(data, error);

      return invite; // return the full invite object
    },

    // ✅ Fix: the callback parameter is invite, not playerId
    onSuccess: handleCallbacks((invite) => {
      queryClient.invalidateQueries({ queryKey: ['TeamPlayers', invite.team_id] });
      queryClient.invalidateQueries({
        queryKey: ['PlayerInvitesAndRequests', { playerId: invite.player_id }],
      });
      Toast.show({ type: 'success', text1: 'Player join request accepted' });
      console.log('Accepted invite:', invite);
    }, callbacks.acceptInvite?.onSuccess),

    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to accept player join request' });
      console.log('Failed to accept player join request:', error);
    }, callbacks.acceptInvite?.onError),
  });

  const denyRequest = useMutation({
    mutationFn: async (playerId) => {
      const id = await findTeamPlayerId(teamId, playerId, PENDING_REQUEST);
      const { data, error } = await supabase.rpc('decline_player_join_team_request', {
        p_team_player_id: id,
      });
      assertRpcOk(data, error);
      return playerId;
    },
    onSuccess: handleCallbacks((playerId) => {
      queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests', { teamId }] });
      refetch();
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
      const id = await findTeamPlayerId(teamId, playerId, PENDING_INVITE);
      const { data, error } = await supabase.rpc('revoke_player_join_team_invite', {
        p_team_player_id: id,
      });
      assertRpcOk(data, error);
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
      const { data, error } = await supabase.rpc('revoke_player_join_team_request', {
        p_team_player_id: requestId,
      });
      assertRpcOk(data, error);
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
      const { data, error } = await supabase.rpc('leave_team', {
        _team_id: team.id,
        _player_id: player.id,
      });

      assertRpcOk(data, error);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['TeamPlayers', variables.team.id] });
      refetch();
      Toast.show({
        type: 'success',
        text1: 'Left team',
        text2: `You have left ${variables.team.display_name}`,
      });
      callbacks.leaveTeam?.onSuccess?.(data, variables);
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: 'Failed to leave team', text2: error.message });
      callbacks.leaveTeam?.onError?.(error);
    },
  });

  const sendJoinRequest = useMutation({
    mutationFn: async (teamId) => {
      const { data, error } = await supabase.rpc('request_player_join_team', {
        p_team_id: teamId,
      });
      assertRpcOk(data, error);
      return { teamId, data };
    },
    onSuccess: handleCallbacks(({ teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests', { teamId }] });
      Toast.show({ type: 'success', text1: 'Join request sent' });
    }, callbacks.sendJoinRequest?.onSuccess),
    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to send join request', text2: error.message });
      console.log('Failed to send join request:', error);
    }, callbacks.sendJoinRequest?.onError),
  });

  const removeFromDivision = useMutation({
    mutationFn: async ({ teamId, divisionId }) => {
      const { error } = await supabase.rpc('remove_team_from_division', { p_team_id: teamId });
      if (error) throw error;

      return { teamId, divisionId };
    },
    onSuccess: handleCallbacks(({ divisionId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams', divisionId] });
      Toast.show({ type: 'success', text1: 'Team removed from division' });
    }, callbacks.removeFromDivision?.onSuccess),
    onError: handleCallbacks((error) => {
      Toast.show({ type: 'error', text1: 'Failed to remove team from division' });
      console.log('Failed to remove team from division:', error);
    }, callbacks.removeFromDivision?.onError),
  });

  return {
    removePlayer,
    promoteToCaptain,
    acceptRequest,
    acceptInvite,
    denyRequest,
    revokeInvite,
    leaveTeam,
    sendJoinRequest,
    revokeRequest,
    removeFromDivision,
  };
}

export default useTeamPlayerActions;
