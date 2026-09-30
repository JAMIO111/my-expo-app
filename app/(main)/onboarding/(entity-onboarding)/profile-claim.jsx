import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { useUser } from '@contexts/UserProvider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import SafeViewWrapper from '@components/SafeViewWrapper';
import Avatar from '@components/Avatar';
import { useTeamProfile } from '@hooks/useTeamProfile';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';

const ProfileClaim = () => {
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

  return (
    <>
      <Stack.Screen options={{ title: 'Step 4 of 4' }} />

      <SafeViewWrapper useTopInset={false} topColor="bg-brand" bottomColor="bg-brand-dark">
        <View className="flex-1 bg-brand">
          <StepPillGroup steps={4} currentStep={4} />

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-2xl text-text-on-brand">Loading team details…</Text>
            </View>
          ) : (
            <View className="flex-1">
              <Text
                style={{ lineHeight: 50 }}
                className="p-5 font-delagothic text-4xl text-text-on-brand">
                Join {teamProfile?.name || 'Unnamed Team'}?
              </Text>

              <View className="flex-1 justify-between">
                <Text className="mb-6 px-5 font-saira text-2xl text-text-on-brand">
                  {captainApproval || adminApproval
                    ? 'Send a request to join this team.'
                    : 'Join the team straight away.'}
                </Text>
                <ScrollView className="p-5">
                  <View style={{ borderRadius: 25 }} className="bg-bg-2 p-3">
                    <View className="items-stretch rounded-3xl bg-bg-1 p-5 shadow-sm">
                      <Text className="text-center font-saira-medium text-2xl text-text-1">
                        {captainApproval || adminApproval
                          ? `Your join request will be sent to ${
                              captainApproval ? 'the team captain' : ''
                            }${captainApproval && adminApproval ? ' and ' : ''}${
                              adminApproval ? 'the league admin' : ''
                            } for approval.`
                          : 'No approval is needed for this team.'}
                      </Text>
                      <View className="mx-auto rounded-full bg-bg-grouped-2">
                        <MaterialCommunityIcons
                          name="email-fast-outline"
                          color="#0B6623"
                          size={140}
                        />
                      </View>

                      <CTAButton
                        type="yellow"
                        text={
                          isRPCLoading
                            ? 'Sending...'
                            : captainApproval || adminApproval
                              ? 'Send Join Request'
                              : 'Join Team'
                        }
                        disabled={isRPCLoading}
                        callbackFn={handleJoinAsNew}
                      />
                    </View>
                  </View>
                </ScrollView>
                <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 py-6">
                  <CTAButton
                    type="error"
                    text="Join a different team"
                    callbackFn={() => router.back()}
                  />
                </View>
              </View>
            </View>
          )}

        </View>
      </SafeViewWrapper>
    </>
  );
};

export default ProfileClaim;

const styles = StyleSheet.create({});
