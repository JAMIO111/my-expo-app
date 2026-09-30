import { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, Image } from 'react-native';
import { useJoinTeamRequests } from '@hooks/useJoinTeamRequests';
import { useJoinDivisionRequests } from '@hooks/useJoinDivisionRequests';
import TeamLogo from '@components/TeamLogo';
import Avatar from '@components/Avatar';
import { supabase } from '@/lib/supabase';
import { assertRpcOk } from '@lib/rpc';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import { useTheme } from '@contexts/ThemeProvider';
import { useUser } from '@contexts/UserProvider';
import ExpandableView from './ExpandableView';
import { useQueryClient } from '@tanstack/react-query';
import { romanNumerals } from '../lib/badgeIcons';

const TeamJoinRequests = ({ districtId, teamId }) => {
  const { colors: themeColors } = useTheme();
  const queryClient = useQueryClient();
  const { player } = useUser();
  const {
    data: teamRequests,
    isLoading: isLoadingTeamRequests,
    error: teamError,
    refetch: refetchTeamRequests,
  } = useJoinTeamRequests({ districtId, teamId });
  const {
    data: divisionRequests,
    isLoading: isLoadingDivisionRequests,
    error: divisionError,
    refetch: refetchDivisionRequests,
  } = useJoinDivisionRequests({
    districtId,
  });

  console.log('Team Join Requests:', teamRequests);
  console.log('Division Join Requests:', divisionRequests);

  const requests = [
    ...(teamRequests || []).map((r) => ({
      ...r,
      requester_type: 'player',
      request_type: 'team',
      requester_name: `${r.player.first_name} ${r.player.surname}`,
      is_invite: r.kind === 'invite',
      request_target: r.team.display_name,
      crest: r.team.crest,
    })),
    ...(divisionRequests || []).map((r) => ({
      ...r,
      requester_type: r.player_id ? 'player' : 'team',
      request_type: 'division',
      requester_name: r.player_id
        ? `${r.player?.first_name || ''} ${r.player?.surname || ''}`
        : r.team?.display_name,
      request_target: r.division_name,
      crest: r.team?.crest,
    })),
  ];

  const isAdminView = !!districtId;
  const isCaptainView = !!teamId && !districtId;

  // Does this row need a decision from the person looking at it?
  const needsMyAction = (req) => {
    if (req.request_type === 'team') {
      if (isAdminView) return !!req.awaiting_admin;
      return !!req.awaiting_captain;
    }
    return req.status === 'pending_admin';
  };

  const pendingCount = requests?.filter(needsMyAction).length;

  const [showView, setShowView] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const getRequestUI = (req) => {
    const badges = [];

    if (req.request_type === 'team') {
      if (req.awaiting_captain) badges.push({ text: 'Awaiting Captain', color: 'orange' });
      if (req.awaiting_admin) badges.push({ text: 'Awaiting Admin', color: 'orange' });
      if (req.awaiting_player) badges.push({ text: 'Awaiting Player', color: 'orange' });
      return { showActions: needsMyAction(req), badges };
    }

    // division requests are only ever waiting on an admin
    if (req.status === 'pending_admin') badges.push({ text: 'Awaiting Admin', color: 'orange' });
    return { showActions: needsMyAction(req), badges };
  };

  const StatusBadge = ({ text, color }) => {
    const colorMap = {
      orange: {
        bg: 'bg-theme-orange/10',
        border: 'border-theme-orange/50',
        dot: 'bg-theme-orange',
        text: 'text-theme-orange',
      },
      green: {
        bg: 'bg-theme-green/10',
        border: 'border-theme-green/50',
        dot: 'bg-theme-green',
        text: 'text-theme-green',
      },
      red: {
        bg: 'bg-theme-red/10',
        border: 'border-theme-red/50',
        dot: 'bg-theme-red',
        text: 'text-theme-red',
      },
    };

    const styles = colorMap[color] || colorMap.green;

    return (
      <View
        className={`flex-row items-center gap-2 rounded-lg border px-2 py-1 ${styles.bg} ${styles.border}`}>
        <View className={`h-3 w-3 rounded-full ${styles.dot}`} />
        <Text className={`font-saira-medium text-xs ${styles.text}`}>{text}</Text>
      </View>
    );
  };

  const handleAnimationEnd = () => {
    setModalConfig(null);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const openConfirmModal = (request, action, request_type, requester_type, subject, target) => {
    setModalConfig({
      requestId: request.id,
      action,
      title: action === 'approve' ? 'Approve Request?' : 'Reject Request?',
      message:
        action === 'approve'
          ? `Are you sure you want to accept ${subject} into ${target}?`
          : `Are you sure you want to reject ${subject}'s ${request.is_invite ? 'invite to' : 'request to join'} ${target}?`,

      topButtonText: 'Cancel',
      topButtonType: action === 'approve' ? 'default' : 'default',
      bottomButtonText: action === 'approve' ? 'Approve' : 'Reject',

      bottomButtonType: action === 'approve' ? 'success' : 'error',

      // Uses the arguments directly: modalConfig is still the previous value inside this closure.
      bottomButtonFn: () => {
        request_type === 'team'
          ? handlePlayerJoinTeam(request.id, action)
          : handleJoinDivision(request.id, action);
      },
      request_type,
      requester_type,
    });
    setModalVisible(true);
  };

  const handleJoinDivision = async (requestId, action) => {
    setModalVisible(false);
    try {
      const request = requests.find((r) => r.id === requestId);

      if (!request) {
        throw new Error('Request not found (probably stale state)');
      }

      setProcessingId(requestId);

      const { data, error } = await supabase.rpc('handle_join_division_request', {
        p_request_id: requestId,
        p_action: action,
      });
      assertRpcOk(data, error);

      queryClient.invalidateQueries(['TeamPlayers', teamId]);

      Toast.show({
        type: 'success',
        text1: action === 'approve' ? 'Request Approved' : 'Request Rejected',
        text2:
          action === 'approve'
            ? `${request.requester_name} has been added to ${
                teamId ? 'your team' : request.team.display_name
              }.`
            : `${request.requester_name}'s request was rejected.`,
      });

      refetchTeamRequests();
      refetchDivisionRequests();
    } catch (err) {
      console.error('Error handling join request:', err);
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2: err.message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handlePlayerJoinTeam = async (requestId, action) => {
    setModalVisible(false);
    try {
      const request = requests.find((r) => r.id === requestId);

      if (!request) {
        throw new Error('Request not found (probably stale state)');
      }

      setProcessingId(requestId);

      // The RPCs work out from the signed-in user whether they act as captain or admin.
      const rpcName =
        action === 'approve'
          ? request.is_invite
            ? 'accept_player_join_team_invite'
            : 'accept_player_join_team_request'
          : 'decline_player_join_team_request';
      const { data, error } = await supabase.rpc(rpcName, { p_team_player_id: requestId });
      assertRpcOk(data, error);

      queryClient.invalidateQueries(['TeamPlayers', request.team_id ?? teamId]);
      queryClient.invalidateQueries(['PlayerInvitesAndRequests']);

      Toast.show({
        type: 'success',
        text1: action === 'approve' ? 'Request Approved' : 'Request Rejected',
        text2:
          action === 'approve'
            ? data?.teamPlayer?.status && data.teamPlayer.status !== 'active'
              ? `Your approval is recorded. ${request.requester_name} still needs approval from someone else.`
              : `${request.requester_name} has been added to ${
                  teamId ? 'your team' : request.team.display_name
                }.`
            : `${request.requester_name}'s ${request.is_invite ? 'invite' : 'request'} was rejected.`,
      });

      refetchTeamRequests();
      refetchDivisionRequests();
    } catch (err) {
      console.error('Error handling join request:', err);
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2: err.message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoadingTeamRequests || isLoadingDivisionRequests) {
    return (
      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-center gap-5 rounded-2xl bg-bg-2 p-8 shadow-sm">
          <ActivityIndicator size="small" color={themeColors.secondaryText} />
          <Text className="font-saira text-text-1">Loading Team Join Requests...</Text>
        </View>
      </View>
    );
  }

  if (teamError || divisionError) {
    return (
      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-center gap-5 rounded-2xl bg-bg-2 p-8 shadow-sm">
          <Ionicons name="warning" size={24} color="#E53E3E" />
          <Text className="text-center font-saira-medium text-theme-red">
            Failed to load requests
          </Text>
        </View>
      </View>
    );
  }

  if (!requests?.length) {
    return null;
  }

  return (
    <>
      <ExpandableView
        title="Join Team Requests"
        show={showView}
        setShow={setShowView}
        notificationCount={pendingCount}>
        <View className="gap-3">
          {requests.map((req) => {
            const isProcessing = processingId === req.id;
            const { showActions, badges } = getRequestUI(req);

            return (
              <View
                key={req.id}
                className="flex-row items-center justify-between rounded-2xl bg-bg-grouped-3 px-3 py-3">
                {/* LEFT */}
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="flex-1 gap-3">
                    <View className="flex-row items-center gap-4">
                      {req.requester_type === 'player' ? (
                        <Avatar player={req.player} size={28} borderRadius={6} />
                      ) : (
                        <TeamLogo size={30} {...req.crest} />
                      )}
                      <Text className="font-saira-semibold text-lg text-text-1">
                        {req.requester_name}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-4">
                      {req.request_type === 'team' ? (
                        <TeamLogo size={30} {...req.crest} />
                      ) : (
                        <Image
                          source={romanNumerals[req.tier]}
                          style={{ width: 32, height: 34 }}
                          resizeMode="contain"
                        />
                      )}
                      <View>
                        <Text className="font-saira-semibold text-text-1">
                          {req.is_invite ? 'Invited to' : 'To Join →'} {req.request_target}
                        </Text>

                        <Text className="mt-1 font-saira text-sm text-text-2">
                          {`${req.is_invite ? 'Invited' : 'Requested'} - ${new Date(
                            req.requested_at
                          ).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* RIGHT */}
                <View className="items-end gap-3">
                  {/* BADGES */}
                  {badges.map((b, i) => (
                    <StatusBadge key={i} {...b} />
                  ))}

                  {/* ACTIONS */}
                  {showActions && (
                    <View className="flex-row items-center gap-1 px-2">
                      <Pressable
                        onPress={() =>
                          openConfirmModal(
                            req,
                            'reject',
                            req.request_type,
                            req.requester_type,
                            req.requester_name,
                            req.request_target
                          )
                        }
                        disabled={isProcessing}
                        className="p-2">
                        <Ionicons name="close" size={34} color={isProcessing ? 'gray' : 'red'} />
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          openConfirmModal(
                            req,
                            'approve',
                            req.request_type,
                            req.requester_type,
                            req.requester_name,
                            req.request_target
                          )
                        }
                        disabled={isProcessing}
                        className="p-2">
                        <Ionicons
                          name="checkmark"
                          size={40}
                          color={isProcessing ? 'gray' : 'green'}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ExpandableView>
      <FloatingBottomSheet
        visible={modalVisible}
        onCancel={closeModal}
        title={modalConfig?.title}
        message={modalConfig?.message}
        topButtonText="Cancel"
        topButtonFn={closeModal}
        topButtonType={modalConfig?.topButtonType}
        bottomButtonText={modalConfig?.action === 'approve' ? 'Approve' : 'Reject'}
        bottomButtonType={modalConfig?.bottomButtonType}
        bottomButtonFn={modalConfig?.bottomButtonFn}
        onAnimationEnd={handleAnimationEnd}
      />
    </>
  );
};

export default TeamJoinRequests;
