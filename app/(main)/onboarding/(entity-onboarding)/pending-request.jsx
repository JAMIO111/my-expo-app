import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useQueryClient } from '@tanstack/react-query';
import RequestStatusCard from '@components/RequestStatusCard';
import { usePlayerInvitesAndRequests } from '@hooks/usePlayerInvitesAndRequests';
import { useUser } from '@contexts/UserProvider';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import LoadingScreen from '@components/LoadingScreen';
import CTAButton from '@components/CTAButton';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';

const PendingRequest = () => {
  const router = useRouter();
  const { player } = useUser();
  const queryClient = useQueryClient();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const {
    data: invitesAndRequests,
    isLoading,
    isFetching,
    refetch,
  } = usePlayerInvitesAndRequests({
    playerId: player?.id,
  });

  const onRefresh = () => refetch();

  console.log('Player Invites and Requests:', invitesAndRequests);

  const cancelRequest = async (requestId) => {
    if (!requestId) return;

    try {
      const { error } = await supabase.from('TeamPlayers').delete().eq('id', requestId);

      if (error) {
        throw error;
      }

      Toast.show({
        type: 'success',
        text1: 'Request Cancelled',
        text2: 'Your request has been successfully cancelled.',
      });

      setConfirmModalVisible(false);
      setCancellingId(null);
      queryClient.invalidateQueries(['playerInvitesAndRequests', player?.id]);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error Cancelling Request',
        text2: error?.message || 'Something went wrong',
      });

      console.error('Cancel request error:', error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <StatusBar style="light" />
      <View className="flex-1 bg-brand">
        <View className="px-6">
          <Text className="mb-4 pt-2 font-delagothic text-4xl font-bold text-text-on-brand">
            Pending Request
          </Text>
          <Text className="font-saira text-xl text-text-on-brand-2">
            View the status of your join request. Once your request is approved, you will be added
            to the team and can start competing!
          </Text>
        </View>

        {isLoading ? (
          <LoadingScreen />
        ) : invitesAndRequests?.length > 0 ? (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor="#fff" />
            }
            contentContainerStyle={{ padding: 20, gap: 20 }}>
            {invitesAndRequests.map((item) => (
              <RequestStatusCard
                key={item.id}
                request={item}
                onCancel={() => {
                  setCancellingId(item.id);
                  setConfirmModalVisible(true);
                }}
              />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-stretch justify-center p-10">
            <Text className="pb-16 text-center font-saira text-2xl text-text-on-brand">
              No pending requests found. Return to the first onboarding step to join a team.
            </Text>

            <CTAButton
              type="yellow"
              text="Return to Onboarding"
              callbackFn={async () => {
                try {
                  if (!player?.id) {
                    Toast.show({
                      type: 'error',
                      text1: 'Not signed in',
                      text2: 'Please log in again.',
                    });
                    return;
                  }

                  const { error } = await supabase
                    .from('Players')
                    .update({ onboarding: 1 })
                    .eq('id', player.id);

                  if (error) {
                    throw error;
                  }
                  router.replace('/(main)/onboarding/(entity-onboarding)/admin-or-player');
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: 'Error Resetting Onboarding',
                    text2: error?.message || 'Something went wrong',
                  });

                  console.error('Reset onboarding error:', error);
                }
              }}
            />
          </View>
        )}
      </View>
      <FloatingBottomSheet
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        title="Cancel Join Request?"
        message="Are you sure you want to cancel your join request?"
        onCancel={() => setConfirmModalVisible(false)}
        topButtonText="No, Keep Request"
        bottomButtonText="Yes, Cancel Request"
        topButtonType="default"
        bottomButtonType="error"
        topButtonFn={() => setConfirmModalVisible(false)}
        bottomButtonFn={() => cancelRequest(cancellingId)}
      />
    </>
  );
};

export default PendingRequest;
