import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import RequestStatusCard from '@components/RequestStatusCard';
import { usePlayerInvitesAndRequests } from '@hooks/usePlayerInvitesAndRequests';
import { useUser } from '@contexts/UserProvider';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import LoadingScreen from '@components/LoadingScreen';
import CTAButton from '@components/CTAButton';
import { supabase } from '@/lib/supabase';
import { assertRpcOk } from '@lib/rpc';
import Toast from 'react-native-toast-message';
import TeamLogo from '@components/TeamLogo';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';

const PendingRequest = () => {
  useOnboardingStep(null, null, { showBack: false });
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

  const [teamRequests, setTeamRequests] = useState([]);
  const [teamRequestsLoading, setTeamRequestsLoading] = useState(true);
  const [cancellingTeamId, setCancellingTeamId] = useState(null);

  const loadTeamRequests = useCallback(async () => {
    const { data, error } = await supabase.rpc('my_pending_team_creations');
    if (!error) setTeamRequests(data || []);
    setTeamRequestsLoading(false);
  }, []);

  useEffect(() => {
    loadTeamRequests();
  }, [loadTeamRequests]);

  const onRefresh = async () => {
    await Promise.all([refetch(), loadTeamRequests()]);
    queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
  };

  const cancelTeamRequest = async (teamId) => {
    try {
      const { data, error } = await supabase.rpc('cancel_team_creation', { p_team_id: teamId });
      assertRpcOk(data, error);
      Toast.show({
        type: 'success',
        text1: 'Request Cancelled',
        text2: 'Your team request has been cancelled.',
      });
      setCancellingTeamId(null);
      await queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
      router.replace('/(main)/onboarding/(entity-onboarding)/admin-or-player');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error Cancelling Request',
        text2: error?.message || 'Something went wrong',
      });
    }
  };

  console.log('Player Invites and Requests:', invitesAndRequests);

  const cancelRequest = async (requestId) => {
    if (!requestId) return;

    try {
      const { data, error } = await supabase.rpc('revoke_player_join_team_request', {
        p_team_player_id: requestId,
      });
      assertRpcOk(data, error);

      Toast.show({
        type: 'success',
        text1: 'Request Cancelled',
        text2: 'Your request has been successfully cancelled.',
      });

      setConfirmModalVisible(false);
      setCancellingId(null);
      queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests'] });
      queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
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
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <View className="flex-1 bg-brand">
        <View className="px-6">
          <Text className="mb-4 pt-2 font-delagothic text-4xl font-bold text-text-on-brand">
            Pending Request
          </Text>
          <Text className="font-saira text-xl text-text-on-brand-2">
            View the status of your request. Once it is approved, you will be added and can start
            competing!
          </Text>
        </View>

        {isLoading || teamRequestsLoading ? (
          <LoadingScreen />
        ) : invitesAndRequests?.length > 0 || teamRequests.length > 0 ? (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor="#fff" />
            }
            contentContainerStyle={{ padding: 20, gap: 20 }}>
            {teamRequests.map((item) => (
              <View
                key={item.team_id}
                style={{ borderRadius: 26 }}
                className="bg-bg-1 p-3 shadow-lg">
                <View className="rounded-3xl bg-bg-1 p-5">
                  <Text className="mb-4 font-saira-semibold text-lg text-text-1">
                    New Team Request
                  </Text>
                  <View className="mb-4 h-12 w-full flex-row items-center border-b border-bg-2 pb-4">
                    <TeamLogo size={30} {...item.crest} />
                    <Text className="ml-3 font-saira-semibold text-xl text-text-1">
                      {item.display_name}
                    </Text>
                  </View>
                  <Text className="font-saira text-lg text-text-2">
                    Waiting for a {item.league_name || 'league'} admin to approve your team in{' '}
                    {item.division_name}.
                  </Text>
                  <Text className="mt-2 font-saira text-base text-text-2">
                    Requested:{' '}
                    {item.requested_at ? new Date(item.requested_at).toLocaleString() : '—'}
                  </Text>
                  <View className="mt-4">
                    <CTAButton
                      type="error"
                      text="Cancel Request"
                      callbackFn={() => setCancellingTeamId(item.team_id)}
                    />
                  </View>
                </View>
              </View>
            ))}
            {(invitesAndRequests || []).map((item) => (
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
                  const { error } = await supabase.rpc('reset_onboarding_choice');
                  if (error) throw error;
                  await queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
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
        visible={!!cancellingTeamId}
        onClose={() => setCancellingTeamId(null)}
        title="Cancel Team Request?"
        message="Your team will be removed and you'll go back to the start."
        onCancel={() => setCancellingTeamId(null)}
        topButtonText="No, Keep Request"
        bottomButtonText="Yes, Cancel Request"
        topButtonType="default"
        bottomButtonType="error"
        topButtonFn={() => setCancellingTeamId(null)}
        bottomButtonFn={() => cancelTeamRequest(cancellingTeamId)}
      />
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
