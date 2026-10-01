import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { useUser } from '@contexts/UserProvider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CTAButton from '@components/CTAButton';
import SafeViewWrapper from '@components/SafeViewWrapper';
import Avatar from '@components/Avatar';
import { useTeamProfile } from '@hooks/useTeamProfile';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

const ProfileClaim = () => {
  useOnboardingStep(3, 3);
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const team = JSON.parse(params.team || '{}');
  const { player } = useUser();
  console.log('Onboarding Profile Claim - player:', player);

  const { data: teamProfile, isLoading: teamLoading } = useTeamProfile(team?.id);
  console.log('Onboarding Profile Claim - teamProfile:', teamProfile);

  // Display hints only: the server decides which approvals actually apply.
  const adminApproval = !!teamProfile?.division?.admin_approval_required;
  const captainApproval = !!teamProfile?.private;

  const [isRPCLoading, setIsRPCLoading] = useState(false);
  const isLoading = teamLoading;

  const handleJoinAsNew = async () => {
    if (isLoading || isRPCLoading) return; // 🚫 prevents double taps

    if (!player?.id) {
      Toast.show({
        type: 'error',
        text1: 'No Player Profile',
        text2: 'Please try again.',
      });
      return;
    }

    try {
      setIsRPCLoading(true);

      // The server works out which approvals this team and league need.
      const { data, error } = await supabase.rpc('request_join_team_onboarding', {
        p_team_id: teamProfile.id,
        p_player_id: player.id,
      });

      if (error) {
        throw new Error(error.message || 'RPC_FAILED');
      }

      const status = data?.status;
      const needsCaptain = status === 'pending_captain' || status === 'pending_both';
      const needsAdmin = status === 'pending_admin' || status === 'pending_both';

      Toast.show({
        type: 'success',
        text1: needsCaptain || needsAdmin ? 'Join Request Sent' : 'Joined Team Successfully',
        text2:
          needsCaptain && needsAdmin
            ? 'The captain and admin will review your request.'
            : needsCaptain
              ? 'The captain will review your request.'
              : needsAdmin
                ? 'The admin will review your request.'
                : `You are now a member of ${teamProfile?.name || 'the team'}`,
      });
      await queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests'] });
      await queryClient.invalidateQueries({ queryKey: ['authUserProfile'] });
      if (needsAdmin || needsCaptain) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'pending-request' }],
        });
      } else {
        router.push('/home');
      }
    } catch (err) {
      console.error(err);

      let message = 'Something went wrong. Please try again.';

      if (err?.message === 'ALREADY_IN_TEAM') {
        message = 'You are already in this team.';
      } else if (err?.message === 'ALREADY_IN_DISTRICT') {
        message = 'You are already on another team in this league.';
      } else if (err?.message === 'TEAM_NOT_FOUND') {
        message = 'This team is not accepting players right now.';
      } else if (err?.message === 'RPC_FAILED') {
        message = 'Could not complete request.';
      }

      Toast.show({
        type: 'error',
        text1: 'Join Failed',
        text2: message,
      });
    } finally {
      setIsRPCLoading(false);
    }
  };

  const needsApproval = captainApproval || adminApproval;
  const who = [captainApproval && 'the team captain', adminApproval && 'the league admin']
    .filter(Boolean)
    .join(' and ');

  return (
    <OnboardingScreen
      title={isLoading ? 'Loading…' : `Join ${teamProfile?.name || 'this team'}?`}
      subtitle={
        needsApproval
          ? `Your request will be sent to ${who} for approval.`
          : 'No approval is needed, you will join straight away.'
      }
      onCta={handleJoinAsNew}
      ctaText={isRPCLoading ? 'Sending…' : needsApproval ? 'Send join request' : 'Join team'}
      ctaDisabled={isLoading || isRPCLoading}
      ctaLoading={isRPCLoading}
      footerExtra={
        <Pressable onPress={() => router.back()} className="items-center py-1">
          <Text className="font-saira-medium text-base text-text-on-brand-2 underline">
            Join a different team
          </Text>
        </Pressable>
      }>
      <Animated.View entering={FadeInDown.duration(380)} className="items-center gap-5 rounded-3xl border-2 border-white/15 bg-white/10 p-8">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-white/15">
          <MaterialCommunityIcons name={needsApproval ? 'email-fast-outline' : 'account-check-outline'} color="#FFFFFF" size={52} />
        </View>
        <Text className="text-center font-saira-medium text-xl text-text-on-brand">
          {needsApproval
            ? "You'll get a notification as soon as it's answered."
            : 'You can start playing right away.'}
        </Text>
      </Animated.View>
    </OnboardingScreen>
  );
};

export default ProfileClaim;
