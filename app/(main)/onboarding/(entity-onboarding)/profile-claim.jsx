import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useUser } from '@contexts/UserProvider';
import { ScrollView } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import SafeViewWrapper from '@components/SafeViewWrapper';
import Avatar from '@components/Avatar';
import { useTeamProfile } from '@hooks/useTeamProfile';
import { useRequestToJoinTeam } from '@hooks/useRequestToJoinTeam';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import Toast from 'react-native-toast-message';

const ProfileClaim = () => {
  const { client: supabase } = useSupabaseClient();
  const router = useRouter();
  const params = useLocalSearchParams();

  const team = JSON.parse(params.team || '{}');
  const { player } = useUser();
  console.log('Onboarding Profile Claim - player:', player);

  const { data: teamProfile, isLoading: teamLoading } = useTeamProfile(team?.id);
  console.log('Onboarding Profile Claim - teamProfile:', teamProfile);

  const [playersData, setPlayersData] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const adminApproval = teamProfile?.division?.admin_approval_required || false;
  const captainApproval = teamProfile?.private || false;

  const sendJoinRequest = useRequestToJoinTeam(teamProfile, player?.id, adminApproval);

  useEffect(() => {
    if (!teamProfile?.id) return;

    const fetchPlayers = async () => {
      setPlayersLoading(true);

      const { data, error } = await supabase
        .from('TeamPlayers')
        .select('*, Players!TeamPlayers_player_id_fkey(*)')
        .eq('team_id', teamProfile.id);

      if (!error) {
        setPlayersData(data.filter((row) => !row.Players?.claimed) || []);
      }

      setPlayersLoading(false);
    };

    fetchPlayers();
  }, [teamProfile?.id]);

  const isLoading = teamLoading || playersLoading;
  const noUnclaimedPlayers = !isLoading && playersData.length === 0;

  const handleJoinAsNew = async () => {
    await sendJoinRequest.mutateAsync();
    Toast.show({
      type: 'success',
      text1: captainApproval || adminApproval ? 'Join Request Sent' : 'Joined Team Successfully',
      text2:
        captainApproval && adminApproval
          ? 'The team captain and league admin will review your request shortly.'
          : captainApproval && !adminApproval
            ? 'The team captain will review your request shortly.'
            : !captainApproval && adminApproval
              ? 'The league admin will review your request shortly.'
              : `You are now a member of ${teamProfile?.name || 'the team'}`,
    });
    await supabase.from('Players').update({ onboarding: 3 }).eq('id', player?.id);

    router.replace('/(main)/onboarding/upgrade');
  };

  const handleClaimProfile = async () => {
    if (!selectedPlayer) return;

    // TODO: claim logic here
    console.log('Claiming player:', selectedPlayer.id);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Step 4 of 4' }} />

      <SafeViewWrapper
        useTopInset={false}
        topColor="bg-brand"
        bottomColor={noUnclaimedPlayers ? 'bg-brand' : 'bg-brand-dark'}>
        <View className="flex-1 bg-brand">
          <StepPillGroup steps={4} currentStep={4} />

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-2xl text-text-on-brand">Loading team details…</Text>
            </View>
          ) : (
            <ScrollView className="flex-1 p-5">
              <Text
                style={{ lineHeight: 50 }}
                className="mb-4 font-delagothic text-5xl text-text-on-brand">
                Join {teamProfile?.name || 'Unnamed Team'}?
              </Text>

              {noUnclaimedPlayers ? (
                <View>
                  <Text className="mb-6 font-saira text-2xl text-text-on-brand">
                    Proceed to join the team as a new player.
                  </Text>

                  <View className="mb-10 mt-4 items-center rounded-3xl bg-bg-1 p-5">
                    <MaterialCommunityIcons name="email-fast-outline" size={160} />
                    <Text className="mt-4 text-center font-saira-semibold text-lg text-text-1">
                      Your join request will be sent to the team captain for approval.
                    </Text>

                    <CTAButton
                      type="yellow"
                      text="Send Join Request"
                      callbackFn={handleJoinAsNew}
                    />
                  </View>

                  <CTAButton
                    type="error"
                    text="Join a different team"
                    callbackFn={() => router.back()}
                  />
                </View>
              ) : (
                <View>
                  <Text className="mb-6 font-saira text-xl text-text-on-brand">
                    If you see your name below, claim your profile. Otherwise, join as a new player.
                  </Text>

                  {playersData.map((row) => {
                    const player = row.Players;
                    const selected = selectedPlayer?.id === player.id;

                    return (
                      <Pressable
                        key={row.id}
                        onPress={() => setSelectedPlayer(selected ? null : player)}
                        className="mb-4 flex-row items-center gap-4 rounded-2xl bg-bg-grouped-2 p-4">
                        <Avatar player={player} size={48} borderRadius={6} />

                        <View className="flex-1">
                          <Text className="font-saira-medium text-xl text-text-1">
                            {player.first_name} {player.surname}
                          </Text>
                          <Text className="font-saira text-lg text-text-2">
                            {player.nickname || 'No nickname'}
                          </Text>
                        </View>

                        {selected ? (
                          <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                        ) : (
                          <Ionicons name="chevron-forward-outline" size={26} color="#9CA3AF" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}

          {!isLoading && !noUnclaimedPlayers && (
            <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 pb-3 pt-6">
              <CTAButton
                type="error"
                text="Join a different team"
                callbackFn={() => router.back()}
              />

              <CTAButton
                type="yellow"
                text={
                  selectedPlayer
                    ? 'Claim Profile'
                    : captainApproval || adminApproval
                      ? 'Request To Join Team'
                      : 'Join as New Player'
                }
                callbackFn={selectedPlayer ? handleClaimProfile : handleJoinAsNew}
              />
            </View>
          )}
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default ProfileClaim;

const styles = StyleSheet.create({});
