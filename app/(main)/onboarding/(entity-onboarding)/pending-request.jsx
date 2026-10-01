import { StyleSheet, Text, View, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
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
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

  const hasItems = invitesAndRequests?.length > 0 || teamRequests.length > 0;
  const loadingAll = isLoading || teamRequestsLoading;

  const returnToStart = async () => {
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
  };

  return (
    <>
      <Stack.Screen options={{ headerBackVisible: false, gestureEnabled: false }} />
      <OnboardingScreen
        title={hasItems ? 'Waiting for approval' : 'Nothing pending'}
        subtitle={
          hasItems
            ? "We'll let you know the moment it's answered. Pull down to refresh."
            : 'You have no open requests. Start again to join or create a team.'
        }
        onCta={!hasItems && !loadingAll ? returnToStart : undefined}
        ctaText="Start again"
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor="#fff" />
        }>
        {loadingAll ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#FFFFFF99" size="large" />
          </View>
        ) : (
          <View className="gap-5">
            {teamRequests.map((item, i) => (
              <Animated.View
                key={item.team_id}
                entering={FadeInDown.delay(i * 80).duration(380)}
                className="rounded-3xl border-2 border-white/15 bg-white/10 p-5">
                <Text className="mb-4 font-saira-semibold text-xs uppercase tracking-[2px] text-text-on-brand-2">
                  New team request
                </Text>
                <View className="mb-4 flex-row items-center gap-4 border-b border-white/15 pb-4">
                  <TeamLogo size={40} {...item.crest} />
                  <Text className="flex-1 font-saira-bold text-2xl text-text-on-brand">
                    {item.display_name}
                  </Text>
                </View>
                <Text className="font-saira text-lg text-text-on-brand">
                  Waiting for a {item.league_name || 'league'} admin to approve your team in{' '}
                  {item.division_name}.
                </Text>
                <Text className="mt-2 font-saira text-sm text-text-on-brand-2">
                  Requested {item.requested_at ? new Date(item.requested_at).toLocaleString() : '—'}
                </Text>
                <Pressable
                  onPress={() => setCancellingTeamId(item.team_id)}
                  className="mt-5 items-center rounded-2xl border-2 border-red-400/60 bg-red-400/10 py-3">
                  <Text className="font-saira-semibold text-lg text-red-300">Cancel request</Text>
                </Pressable>
              </Animated.View>
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
          </View>
        )}
      </OnboardingScreen>
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
