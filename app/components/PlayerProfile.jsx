import ConfirmModal from '@components/ConfirmModal';
import { ScrollView, View, Image, Text, StyleSheet, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useUser } from '@contexts/UserProvider';
import { getAgeInYearsAndDays } from '@lib/helperFunctions';
import CTAButton from '@components/CTAButton';
import Heading from '@components/Heading';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import Toast from 'react-native-toast-message';
import LoadingSplash from '@components/LoadingSplash';
import StatCard from '@components/StatCard';
import { isBirthdayToday } from '@lib/helperFunctions';
import CachedImage from '@components/CachedImage';
import { usePlayerStats } from '@hooks/usePlayerStats';

const PlayerProfile = ({ context, isLoading, playerProfile, error }) => {
  const { client: supabase } = useSupabaseClient();
  const router = useRouter();
  const { fixtureId, teamId, userId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [captainModalVisible, setCaptainModalVisible] = useState(false);
  const [viceCaptainModalVisible, setViceCaptainModalVisible] = useState(false);
  const [removePlayerModalVisible, setRemovePlayerModalVisible] = useState(false);
  const { refetch, loading, currentRole, player } = useUser();
  const { data: playerStats, error: playerStatsError } = usePlayerStats(playerProfile?.id);

  console.log('Player Profile Data:', playerProfile);

  if (error) {
    console.error('Error loading user profile:', error);
    return (
      <View className="w-full flex-1 items-center justify-center bg-bg-grouped-1">
        <Text className="text-text-1">Error loading profile</Text>
      </View>
    );
  }
  if (loading || isLoading) {
    return <LoadingSplash />;
  }

  const { years, days } = getAgeInYearsAndDays(playerProfile?.dob);

  const handleConfirmTransferCaptaincy = async () => {
    const { data, error } = await supabase
      .from('Teams')
      .update({ captain: playerProfile.id })
      .eq('id', currentRole.team.id);
    setCaptainModalVisible(false);

    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'We could not change your team captain.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      console.error('Supabase update error:', error);
    } else {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your team captain has been changed.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      console.log('Confirmed!');
      refetch();
    }
  };

  const handleConfirmTransferViceCaptaincy = async () => {
    const { data, error } = await supabase
      .from('Teams')
      .update({ vice_captain: playerProfile.id })
      .eq('id', currentRole.team.id);
    setViceCaptainModalVisible(false);

    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'We could not change your vice captain.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      console.error('Supabase update error:', error);
    } else {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your vice captain has been changed.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      console.log('Confirmed!');
      refetch();
    }
  };

  const handlePlayerRemove = async () => {
    if (playerProfile?.id === player.id) {
      await supabase.from('Players').update({ team_id: null }).eq('id', player.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'You have left the team.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      router.push('/home');
    }
  };

  const handleCancel = () => {
    setCaptainModalVisible(false);
    setRemovePlayerModalVisible(false);
    setViceCaptainModalVisible(false);
  };

  const handleViewStats = () => {
    if (context === 'home/league') {
      router.push(`home/league/${teamId}/${userId}/player-stats`);
    } else if (context === 'teams') {
      router.push(`/teams/${userId}/player-stats`);
    } else if (context === 'fixture') {
      router.push(`home/${fixtureId}/${teamId}/${userId}/player-stats`);
    }
  };
  console.log('Player Profile:', playerProfile);
  return (
    <ScrollView
      contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
      className="w-full bg-bg-grouped-1">
      <View className="w-full p-4 px-2">
        <View className="w-full flex-row items-center justify-start gap-6 rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-2 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          {playerProfile?.avatar_url ? (
            <CachedImage
              avatarUrl={playerProfile.avatar_url}
              userId={playerProfile.id}
              width={120}
              height={120}
              borderRadius={12}
            />
          ) : (
            <View
              className="h-32 w-32 items-center justify-center rounded-xl
        border-2 border-brand bg-brand-light">
              <Text className="text-5xl font-bold text-white">
                {playerProfile?.first_name.charAt(0)}
                {playerProfile?.surname.charAt(0)}
              </Text>
            </View>
          )}
          <View className="h-32 justify-center gap-2">
            <Text style={{ lineHeight: 50 }} className="font-saira-medium text-4xl text-text-1">
              {playerProfile?.first_name} {playerProfile?.surname}
            </Text>
            <Text style={{ lineHeight: 30 }} className="font-saira text-3xl text-text-2">
              {playerProfile?.nickname}
            </Text>
            <Text style={{ lineHeight: 25 }} className="font-saira text-xl text-text-2">
              {`Since: ${
                playerProfile?.created_at
                  ? new Date(playerProfile.created_at).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A'
              }`}
            </Text>
          </View>
        </View>
      </View>
      <View className="mb-1 bg-bg-grouped-2 px-2">
        <View className="w-full pt-6">
          <Heading text="Personal Details" />
        </View>
        <View className="flex w-full flex-row px-2 py-4">
          <View className="flex flex-1 flex-col gap-4">
            <View className="flex- w-full flex-col gap-1">
              <Text className="font-saira text-lg text-text-2">TEAM</Text>
              <Text className="font-saira-semibold text-xl text-text-1">
                {playerProfile?.team_name}
              </Text>
            </View>
            <View className="flex- w-full flex-col gap-1">
              <Text className="font-saira text-lg text-text-2">DATE OF BIRTH</Text>
              <Text className="font-saira-semibold text-xl text-text-1">
                {playerProfile?.dob
                  ? new Date(playerProfile.dob).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                  : 'N/A'}
              </Text>
            </View>
          </View>
          <View className="flex flex-1 flex-col gap-4">
            <View className="flex- w-full flex-col gap-1">
              <Text className="font-saira text-lg text-text-2">MEMBER SINCE</Text>
              <Text className="font-saira-semibold text-xl text-text-1">
                {playerProfile?.created_at
                  ? new Date(playerProfile.created_at).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </Text>
            </View>
            <View className="flex- w-full flex-col gap-1">
              <Text className="font-saira text-lg text-text-2">AGE</Text>
              <Text className="font-saira-semibold text-xl text-text-1">
                {`${playerProfile?.dob ? `${years} Years ${days} days` : 'N/A'}  ${isBirthdayToday(playerProfile?.dob) ? '🎂' : ''}`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="w-full bg-bg-grouped-2 px-2 py-6">
        <Heading text="Statistics" />
        <View className="gap-4 px-2">
          <View className="flex-row gap-4">
            <StatCard title="Matches Played" value="86" />
            <StatCard title="MOTMs" value="12" />
          </View>
          <View className="flex-row gap-4">
            <StatCard title="Wins" value="52" />
            <StatCard title="Losses" value="34" />
          </View>
          <CTAButton callbackFn={handleViewStats} text="View All Stats" type="yellow" />
        </View>
      </View>
      <View className="mt-1 w-full gap-6 bg-bg-grouped-2 px-6 py-8">
        <CTAButton type="yellow" callbackFn={() => {}} text="Compare Stats" />
        {currentRole?.team.captain === player?.id && playerProfile?.id !== player?.id && (
          <>
            <CTAButton
              type="brand"
              callbackFn={() => setCaptainModalVisible(true)}
              text="Make Team Captain"
            />
            <ConfirmModal
              visible={captainModalVisible}
              onConfirm={handleConfirmTransferCaptaincy}
              onCancel={handleCancel}
              title="Transfer Captaincy?"
              message={`Are you sure you want to make ${playerProfile?.nickname} the team captain? This cannot be undone.`}
            />
          </>
        )}
        {currentRole?.team.vice_captain === player?.id && playerProfile?.id !== player?.id && (
          <>
            <CTAButton
              type="yellow"
              callbackFn={() => setViceCaptainModalVisible(true)}
              text="Make Vice Captain"
            />
            <ConfirmModal
              visible={viceCaptainModalVisible}
              onConfirm={handleConfirmTransferViceCaptaincy}
              onCancel={handleCancel}
              title="Transfer Vice Captaincy?"
              message={`Are you sure you want to make ${playerProfile?.nickname} the vice captain? This cannot be undone.`}
            />
          </>
        )}
        {(currentRole?.team.captain === player.id || playerProfile?.id === player.id) && (
          <>
            <CTAButton
              type="error"
              callbackFn={
                currentRole?.team.captain === player.id ||
                currentRole?.team.vice_captain === player.id
                  ? () => {
                      Toast.show({
                        type: 'info',
                        text1: 'Attention',
                        text2: `You are the ${currentRole?.team.captain === player.id ? 'team captain' : 'vice captain'}. Please transfer the ${currentRole?.team.captain === player.id ? 'captaincy' : 'vice captaincy'} before leaving the team.`,
                        props: {
                          colorScheme: colorScheme,
                        },
                      });
                    }
                  : () => setRemovePlayerModalVisible(true)
              }
              text={
                currentRole?.team.captain === player.id && playerProfile?.id !== player.id
                  ? 'Remove Player'
                  : 'Leave Team'
              }
            />
            <ConfirmModal
              visible={removePlayerModalVisible}
              onConfirm={handlePlayerRemove}
              onCancel={() => setRemovePlayerModalVisible(false)}
              title={
                currentRole?.team.captain === player.id && playerProfile?.id !== player.id
                  ? 'Remove Player?'
                  : 'Leave Team?'
              }
              message={
                currentRole?.team.captain === player.id && playerProfile?.id !== player.id
                  ? `Are you sure you want to remove ${playerProfile?.nickname} from the team? This cannot be undone.`
                  : 'Are you sure you want to leave the team? You will need the captain to invite you again if you wish to rejoin.'
              }
            />
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default PlayerProfile;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 128,
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
