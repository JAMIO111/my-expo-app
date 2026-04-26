import { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, Image } from 'react-native';
import { useJoinTeamRequests } from '@hooks/useJoinTeamRequests';
import { useJoinDivisionRequests } from '@hooks/useJoinDivisionRequests';
import TeamLogo from '@components/TeamLogo';
import Avatar from '@components/Avatar';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import { useUser } from '@contexts/UserProvider';
import ExpandableView from './ExpandableView';
import { useQueryClient } from '@tanstack/react-query';
import { romanNumerals } from '../lib/badgeIcons';

const TeamJoinRequests = ({ districtId, teamId }) => {
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

  const pendingCount = requests?.filter(
    (req) =>
      req.status === 'pending_both' ||
      (districtId ? req.status === 'pending_admin' : req.status === 'pending_captain')
  ).length;

  const [showView, setShowView] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const isAdminView = !!districtId;
  const isCaptainView = !!teamId && !districtId;

  const getRequestUI = (req) => {
    const { status } = req;

    // DEFAULT
    let showActions = false;
    let badges = [];

    // 🧑‍💼 ADMIN VIEW
    if (isAdminView) {
      if (status === 'pending_admin' || status === 'pending_both') {
        showActions = true;
      }

      if (status === 'pending_both') {
        badges.push({ text: 'Awaiting Admin', color: 'orange' });
      }

      if (status === 'pending_admin') {
        badges.push({ text: 'Awaiting Admin', color: 'orange' });
      }

      if (status === 'pending_captain') {
        badges.push({ text: 'Awaiting Captain', color: 'orange' });
        badges.push({ text: 'Admin Approved', color: 'green' });
      }
    }

    // 🧢 CAPTAIN VIEW
    if (isCaptainView) {
      if (status === 'pending_captain' || status === 'pending_both') {
        showActions = true;
      }

      if (status === 'pending_both') {
        badges.push({ text: 'Awaiting Captain', color: 'orange' });
      }

      if (status === 'pending_captain') {
        badges.push({ text: 'Awaiting Captain', color: 'orange' });
      }

      if (status === 'pending_admin') {
        badges.push({ text: 'Awaiting Admin', color: 'orange' });
        badges.push({ text: 'Captain Approved', color: 'green' });
      }
    }

    return { showActions, badges };
  };

  const StatusBadge = ({ text, color }) => {
    const colorMap = {
      orange: 'theme-orange',
      green: 'theme-green',
      red: 'theme-red',
    };

    return (
      <View
        className={`padding flex-row items-center gap-2 rounded-lg border border-${colorMap[color]}/50 bg-${colorMap[color]}/10 px-2 py-1`}>
        <View className={`h-3 w-3 rounded-full bg-${colorMap[color]}`} />
        <Text className={`font-saira-medium text-xs text-${colorMap[color]}`}>{text}</Text>
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
          : `Are you sure you want to reject ${subject}'s request to join ${target}?`,

      topButtonText: 'Cancel',
      topButtonType: action === 'approve' ? 'default' : 'default',
      bottomButtonText: action === 'approve' ? 'Approve' : 'Reject',

      bottomButtonType: action === 'approve' ? 'success' : 'error',

      bottomButtonFn: () => {
        if (!modalConfig) return;
        modalConfig.request_type === 'team'
          ? handlePlayerJoinTeam(modalConfig.requestId, modalConfig.action)
          : handleJoinDivision(modalConfig.requestId, modalConfig.action);
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

      const { error } = await supabase.rpc('handle_join_division_request', {
        p_request_id: requestId,
        p_action: action,
        p_admin_id: districtId ? player.id : null,
      });

      if (error) throw error;

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

      const { error } = await supabase.rpc('handle_player_join_team_request', {
        p_request_id: requestId,
        p_action: action,
        p_admin_id: districtId ? player.id : null,
        p_captain_id: teamId ? player.id : null,
      });

      if (error) throw error;

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

  if (isLoadingTeamRequests || isLoadingDivisionRequests) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-1 py-4">
        <ActivityIndicator size="large" color="#555555" />
        <Text className="mt-2 font-saira text-text-1">Loading requests...</Text>
      </View>
    );
  }

  if (teamError || divisionError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-1 py-4">
        <Text className="text-center font-saira-medium text-theme-red">
          Failed to load requests
        </Text>
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
        <View className="gap-3 bg-bg-1">
          {requests.map((req) => {
            const isProcessing = processingId === req.id;
            const { showActions, badges } = getRequestUI(req);

            return (
              <View
                key={req.id}
                className="flex-row items-center justify-between rounded-2xl bg-bg-2 px-3 py-3 shadow-sm">
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
                          To Join → {req.request_target}
                        </Text>

                        <Text className="mt-1 font-saira text-sm text-text-2">
                          {`Requested - ${new Date(req.requested_at).toLocaleDateString('en-GB', {
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
