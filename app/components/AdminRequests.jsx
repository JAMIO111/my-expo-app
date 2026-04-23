import { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useTeamPlayerRequestsByDistrict } from '@hooks/useTeamPlayerRequestsByDistrict';
import TeamLogo from '@components/TeamLogo';
import Avatar from '@components/Avatar';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import Heading from './Heading';
import { useUser } from '@contexts/UserProvider';
import ExpandableView from './ExpandableView';

const AdminRequests = ({ districtId }) => {
  const { player } = useUser();
  const { data: requests, isLoading, error, refetch } = useTeamPlayerRequestsByDistrict(districtId);

  const pendingCount = requests?.filter(
    (req) => req.status === 'pending_both' || req.status === 'pending_admin'
  ).length;

  const [showView, setShowView] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const handleAnimationEnd = () => {
    setModalConfig(null);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const openConfirmModal = (requestId, action) => {
    setModalConfig({
      requestId,
      action,
      title: action === 'approve' ? 'Approve Request?' : 'Reject Request?',
      message:
        action === 'approve'
          ? 'This will add the player to the team.'
          : 'This will reject the join request.',

      topButtonText: 'Cancel',
      topButtonType: action === 'approve' ? 'error' : 'default',
      bottomButtonText: action === 'approve' ? 'Approve' : 'Reject',

      bottomButtonType: action === 'approve' ? 'success' : 'error',

      bottomButtonFn: () => {
        if (!modalConfig) return;
        handleAction(modalConfig.requestId, modalConfig.action);
      },
      onAnimationEnd: () => setModalConfig(null),
    });
    setModalVisible(true);
  };

  const handleAction = async (requestId, action) => {
    try {
      setProcessingId(requestId);

      const { error } = await supabase.rpc('admin_handle_player_join_team_request', {
        p_request_id: requestId,
        p_action: action, // 'approve' | 'reject'
        p_admin_id: player.id,
      });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: action === 'approve' ? 'Request Approved' : 'Request Rejected',
      });

      refetch();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2: err.message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-1 py-4">
        <ActivityIndicator size="large" color="#555555" />
        <Text className="mt-2 font-saira text-text-1">Loading requests...</Text>
      </View>
    );
  }

  if (error) {
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
        title={`Pending Join Requests ${pendingCount > 0 ? `(${pendingCount})` : ''}`}
        show={showView}
        setShow={setShowView}>
        <View className="gap-3 bg-bg-1">
          {requests.map((req) => {
            const isProcessing = processingId === req.id;

            return (
              <View
                key={req.id}
                className="flex-row items-center justify-between rounded-2xl bg-bg-2 px-3 py-3 shadow-sm">
                {/* LEFT SIDE */}
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="flex-1 gap-3">
                    <View className="flex-row items-center gap-3">
                      <Avatar player={req.player} size={26} borderRadius={6} />
                      <Text className="font-saira-semibold text-base text-text-1">
                        {req.player.first_name} {req.player.surname}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <TeamLogo size={28} {...req.team.crest} />
                      <View>
                        <Text className="font-saira-semibold text-sm text-text-1">
                          To Join → {req.team.display_name}
                        </Text>

                        <Text className="mt-1 font-saira text-xs text-text-2">
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
                {req.status === 'pending_both' || req.status === 'pending_admin' ? (
                  <View className="items-center justify-start">
                    {/* STATUS BADGE */}
                    {req.status === 'pending_both' ? (
                      <View className="flex-row items-center gap-2 rounded-lg border border-theme-orange/50 bg-theme-orange/10 px-2 py-1">
                        <View className="h-3 w-3 rounded-full bg-theme-orange" />
                        <Text className="font-saira-medium text-xs text-theme-orange">
                          Awaiting Both
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-2 rounded-lg border border-theme-orange/50 bg-theme-orange/10 px-2 py-1">
                        <View className="h-3 w-3 rounded-full bg-theme-orange" />
                        <Text className="font-saira-medium text-xs text-theme-orange">
                          Awaiting Admin
                        </Text>
                      </View>
                    )}

                    {/* ACTIONS */}
                    <View className="flex-row items-center gap-1 px-2">
                      <Pressable
                        onPress={() => openConfirmModal(req.id, 'reject')}
                        disabled={isProcessing}
                        className="p-2">
                        <Ionicons name="close" size={34} color={isProcessing ? 'gray' : 'red'} />
                      </Pressable>

                      <Pressable
                        onPress={() => openConfirmModal(req.id, 'approve')}
                        disabled={isProcessing}
                        className="p-2">
                        <Ionicons
                          name="checkmark"
                          size={40}
                          color={isProcessing ? 'gray' : 'green'}
                        />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="items-start justify-between gap-6">
                    <View className="flex-row items-center gap-2 rounded-lg border border-theme-green/50 bg-theme-green/10 px-2 py-1">
                      <View className="h-3 w-3 rounded-full bg-theme-green" />
                      <Text className="font-saira-medium text-xs text-theme-green">
                        Admin Approved
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2 rounded-lg border border-theme-orange/50 bg-theme-orange/10 px-2 py-1">
                      <View className="h-3 w-3 rounded-full bg-theme-orange" />
                      <Text className="font-saira-medium text-xs text-theme-orange">
                        Awaiting Captain
                      </Text>
                    </View>
                  </View>
                )}
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
        bottomButtonFn={() => handleAction(modalConfig.requestId, modalConfig.action)}
        onAnimationEnd={handleAnimationEnd}
      />
    </>
  );
};

export default AdminRequests;
