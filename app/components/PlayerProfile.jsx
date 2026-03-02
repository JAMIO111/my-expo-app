import ConfirmModal from '@components/ConfirmModal';
import { ScrollView, View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useUser } from '@contexts/UserProvider';
import { getAgeInYearsAndDays } from '@lib/helperFunctions';
import CTAButton from '@components/CTAButton';
import Heading from '@components/Heading';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import LoadingScreen from '@components/LoadingScreen';
import StatCard from '@components/StatCard';
import { isBirthdayToday } from '@lib/helperFunctions';
import CachedImage from '@components/CachedImage';
import { usePlayerStats } from '@hooks/usePlayerStats';
import TrophyCabinet from './TrophyCabinet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';

const PlayerProfile = ({ context, isLoading, playerProfile, error }) => {
  const router = useRouter();
  const { fixtureId, teamId, userId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const queryClient = useQueryClient();
  const [captainModalVisible, setCaptainModalVisible] = useState(false);
  const [viceCaptainModalVisible, setViceCaptainModalVisible] = useState(false);
  const [removePlayerModalVisible, setRemovePlayerModalVisible] = useState(false);
  const { refetch, loading, currentRole, player } = useUser();
  const { data: playerStats, error: playerStatsError } = usePlayerStats(playerProfile?.id);

  console.log('Player Profile:', playerProfile);

  const currentTeam = playerProfile.teams.filter((t) => t.status === 'active')[0] || null;
  const inMyTeam = currentTeam?.team_id === currentRole?.team.id;
  const isMe = playerProfile.id === player.id;
  const iAmCaptain = currentRole?.role === 'captain';
  const iAmViceCaptain = currentRole?.role === 'vice_captain';
  const playerIsCaptain = currentTeam?.role === 'captain';
  const playerIsViceCaptain = currentTeam?.role === 'vice_captain';

  console.log('Current Team:', currentTeam);
  console.log('In My Team:', inMyTeam);
  console.log('I am Captain:', iAmCaptain);
  console.log('I am Vice Captain:', iAmViceCaptain);
  console.log('Player is Captain:', playerIsCaptain);
  console.log('Player is Vice Captain:', playerIsViceCaptain);

  if (error) {
    console.error('Error loading user profile:', error);
    return (
      <View className="w-full flex-1 items-center justify-center bg-bg-grouped-1">
        <Text className="text-text-1">Error loading profile</Text>
      </View>
    );
  }
  if (loading || isLoading) {
    return <LoadingScreen />;
  }

  const { years, days } = getAgeInYearsAndDays(playerProfile?.dob);

  const handleConfirmTransferCaptaincy = async () => {
    try {
      const { error } = await supabase.rpc('transfer_captaincy', {
        p_team_id: currentTeam.team_id,
        p_new_captain_id: playerProfile.id,
      });

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

        queryClient.invalidateQueries(['PlayerProfile', playerProfile.id]);
        queryClient.invalidateQueries(['TeamPlayers', currentTeam.team_id]);
        queryClient.invalidateQueries(['authUserProfile']);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'An unexpected error occurred.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      console.error('Unexpected error:', err);
    } finally {
      setCaptainModalVisible(false);
    }
  };

  const handleConfirmTransferViceCaptaincy = async () => {
    try {
      const { error } = await supabase.rpc('transfer_vice_captaincy', {
        p_team_id: currentTeam.team_id,
        p_new_vice_captain_id: playerProfile.id,
      });
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
        queryClient.invalidateQueries(['PlayerProfile', playerProfile.id]);
        queryClient.invalidateQueries(['TeamPlayers', currentTeam.team_id]);
        queryClient.invalidateQueries(['authUserProfile']);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'An unexpected error occurred.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      console.error('Unexpected error:', err);
    } finally {
      setViceCaptainModalVisible(false);
    }
  };

  const handlePlayerRemove = async () => {
    try {
      const { error } = await supabase.rpc('remove_player_from_team', {
        p_team_id: currentTeam.team_id,
        p_player_id: playerProfile.id,
      });
      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: `We could not remove ${isMe ? 'you' : 'the player'} from the team.`,
          props: {
            colorScheme: colorScheme,
            position: 'top',
          },
        });
      }
      router.push('/home');
      queryClient.invalidateQueries(['PlayerProfile', playerProfile.id]);
      queryClient.invalidateQueries(['TeamPlayers', currentTeam.team_id]);
      queryClient.invalidateQueries(['authUserProfile']);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'An unexpected error occurred.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      console.error('Unexpected error:', err);
    } finally {
      setRemovePlayerModalVisible(false);
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

  return (
    <ScrollView
      contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
      className="w-full bg-bg-grouped-1">
      <View
        className="w-full p-4
       px-2">
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
              <Text className="font-michroma text-4xl text-white">
                {playerProfile?.first_name.charAt(0)}
                {playerProfile?.surname.charAt(0)}
              </Text>
            </View>
          )}
          <View className="h-32 justify-center gap-1">
            <Text style={{ lineHeight: 50 }} className="font-saira-medium text-4xl text-text-1">
              {playerProfile?.first_name} {playerProfile?.surname}
            </Text>
            {playerProfile?.nickname && (
              <Text style={{ lineHeight: 30 }} className="font-saira text-3xl text-text-2">
                {playerProfile?.nickname}
              </Text>
            )}
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
                {currentTeam?.team_name}
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
              <Text className="font-saira text-lg text-text-2">SIGN ON DATE</Text>
              <Text className="font-saira-semibold text-xl text-text-1">
                {currentTeam?.joined_at
                  ? new Date(currentTeam.joined_at).toLocaleDateString('en-GB', {
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
          <CTAButton
            icon={<Ionicons name="stats-chart" size={20} color="black" />}
            callbackFn={handleViewStats}
            text="View All Stats"
            type="yellow"
          />
          <CTAButton
            icon={<Ionicons name="git-compare-outline" size={24} color="white" />}
            type="brand"
            callbackFn={() => {
              context === 'home/league'
                ? router.push({
                    pathname: `home/league/${teamId}/compare-stats`,
                    params: {
                      defaultEntity: JSON.stringify(playerProfile),
                      entityType: 'player',
                    },
                  })
                : context === 'teams'
                  ? router.push({
                      pathname: `/teams/${userId}/compare-stats`,
                      params: {
                        defaultEntity: JSON.stringify(playerProfile),
                        entityType: 'player',
                      },
                    })
                  : context === 'fixture' &&
                    router.push({
                      pathname: `home/upcoming-fixture/${teamId}/compare-stats`,
                      params: {
                        defaultEntity: JSON.stringify(playerProfile),
                        entityType: 'player',
                      },
                    });
            }}
            text="Compare Stats"
          />
        </View>
      </View>
      <View className="mt-1 w-full bg-bg-grouped-2 px-4 py-8">
        <TrophyCabinet trophies={[]} />
      </View>
      <View className="mt-1 w-full gap-6 bg-bg-grouped-2 px-6 py-8">
        {!isMe && iAmCaptain && inMyTeam && (
          <>
            <CTAButton
              type="yellow"
              callbackFn={() => setCaptainModalVisible(true)}
              text="Make Team Captain"
            />
            <ConfirmModal
              type="success"
              visible={captainModalVisible}
              onConfirm={handleConfirmTransferCaptaincy}
              onCancel={handleCancel}
              title="Transfer Captaincy?"
              message={`Are you sure you want to make ${playerProfile?.nickname || `${playerProfile?.first_name} ${playerProfile?.surname}`} the team captain? You will no longer be captain.`}
            />
          </>
        )}
        {!isMe &&
          (iAmViceCaptain || iAmCaptain) &&
          inMyTeam &&
          !playerIsViceCaptain &&
          !playerIsCaptain && (
            <>
              <CTAButton
                type="brand"
                callbackFn={() => setViceCaptainModalVisible(true)}
                text="Make Vice Captain"
              />
              <ConfirmModal
                type="success"
                visible={viceCaptainModalVisible}
                onConfirm={handleConfirmTransferViceCaptaincy}
                onCancel={handleCancel}
                title="Transfer Vice Captaincy?"
                message={`Are you sure you want to make ${playerProfile?.nickname || `${playerProfile?.first_name} ${playerProfile?.surname}`} the vice captain? You will no longer be vice captain.`}
              />
            </>
          )}
        {((iAmCaptain && inMyTeam) || isMe) && (
          <>
            <CTAButton
              type="error"
              callbackFn={
                (iAmCaptain || iAmViceCaptain) && isMe
                  ? () => {
                      Toast.show({
                        type: 'info',
                        text1: 'Attention',
                        text2: `You are the ${iAmCaptain ? 'team captain' : iAmViceCaptain ? 'vice captain' : ''}. Please transfer the ${iAmCaptain ? 'captaincy' : iAmViceCaptain ? 'vice captaincy' : ''} before leaving the team.`,
                        props: {
                          colorScheme: colorScheme,
                        },
                      });
                    }
                  : () => setRemovePlayerModalVisible(true)
              }
              text={!isMe && iAmCaptain ? 'Remove Player' : 'Leave Team'}
            />
            <ConfirmModal
              type="error"
              confirmText={!isMe && iAmCaptain ? 'Remove' : 'Leave'}
              visible={removePlayerModalVisible}
              onConfirm={handlePlayerRemove}
              onCancel={() => setRemovePlayerModalVisible(false)}
              title={isMe ? 'Leave Team?' : 'Remove Player?'}
              message={
                !isMe && iAmCaptain
                  ? `Are you sure you want to remove ${playerProfile?.nickname || `${playerProfile?.first_name} ${playerProfile?.surname}`} from the team? They may not be able to join back until next season.`
                  : 'Are you sure you want to leave the team? You will need the captain to invite you again if you wish to rejoin.'
              }
            />
          </>
        )}
        <Text className="text-center font-saira text-xs text-text-2">{`Player ID: ${playerProfile?.id}`}</Text>
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
