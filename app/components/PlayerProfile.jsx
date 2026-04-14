import ConfirmModal from '@components/ConfirmModal';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
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
  const screenHeight = Dimensions.get('window').height;

  const router = useRouter();
  const { fixtureId, teamId, userId } = useLocalSearchParams();

  const colorScheme = useColorScheme();
  const queryClient = useQueryClient();
  const [captainModalVisible, setCaptainModalVisible] = useState(false);
  const [viceCaptainModalVisible, setViceCaptainModalVisible] = useState(false);
  const [removePlayerModalVisible, setRemovePlayerModalVisible] = useState(false);
  const { refetch, loading, currentRole, player } = useUser();
  const { data: playerStats, error: playerStatsError } = usePlayerStats(playerProfile?.id);

  const [statSlots, setStatSlots] = useState(playerStats?.playerMeta?.displayed_stats || []);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [statModalVisible, setStatModalVisible] = useState(false);

  console.log('Player Profile:', playerProfile);
  console.log('Player Profile Stats:', playerStats);

  const currentTeam =
    context === 'teams'
      ? playerProfile.teams.find((t) => t.team_id === currentRole?.team.id)
      : playerProfile.teams.find((t) => t.team_id === teamId) || null;
  console.log('Current Teams:', playerProfile.teams);
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

  useEffect(() => {
    if (playerStats?.playerMeta?.displayed_stats) {
      setStatSlots(playerStats.playerMeta.displayed_stats);
    }
  }, [playerStats?.playerMeta?.displayed_stats]);

  const openStatSelector = (index) => {
    if (!isMe) return; // safety check
    setEditingSlotIndex(index);
    setStatModalVisible(true);
  };

  const formatStatLabel = (key) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/Percent\b/, '%');

  const statOptions = Object.entries(playerStats?.totalStats || {}).map(([key, value]) => ({
    key,
    label: formatStatLabel(key),
    value,
  }));

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
    <>
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
                width={100}
                height={100}
                borderRadius={10}
              />
            ) : (
              <View
                style={{ height: 100, width: 100, borderRadius: 10 }}
                className="items-center justify-center
        border-2 border-brand bg-brand-light">
                <Text className="font-michroma text-4xl text-white">
                  {playerProfile?.first_name.charAt(0)}
                  {playerProfile?.surname.charAt(0)}
                </Text>
              </View>
            )}
            <View className="justify-center gap-1">
              <Text style={{ lineHeight: 40 }} className="font-saira-semibold text-3xl text-text-1">
                {playerProfile?.first_name} {playerProfile?.surname}
              </Text>
              {playerProfile?.nickname && (
                <Text style={{ lineHeight: 26 }} className="font-saira-medium text-2xl text-text-1">
                  {playerProfile?.nickname.toUpperCase()}
                </Text>
              )}
              <Text style={{ lineHeight: 24 }} className="font-saira text-xl text-text-2">
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
              {statSlots.slice(0, 2).map((slotKey, index) => {
                const stat = statOptions.find((s) => s.key === slotKey);

                return (
                  <StatCard
                    key={index}
                    title={stat?.label || '—'}
                    value={stat?.value ?? 0}
                    onPress={() => openStatSelector(index)}
                    disabled={!isMe}
                  />
                );
              })}
            </View>

            <View className="flex-row gap-4">
              {statSlots.slice(2, 4).map((slotKey, index) => {
                const stat = statOptions.find((s) => s.key === slotKey);

                return (
                  <StatCard
                    key={index + 2}
                    title={stat?.label || '—'}
                    value={stat?.value ?? 0}
                    onPress={() => openStatSelector(index + 2)}
                    disabled={!isMe}
                  />
                );
              })}
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
      <Modal
        visible={statModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setStatModalVisible(false)}>
        <View className="flex-1 justify-center bg-black/40 p-6 shadow-md">
          <View
            style={{ maxHeight: screenHeight * 0.7 }}
            className="rounded-3xl bg-bg-grouped-2 p-2">
            <Text className="my-4 text-center font-saira-semibold text-2xl text-text-1">
              Select Stat
            </Text>
            <ScrollView className="mb-4 px-4">
              {statOptions.map((stat) => (
                <Pressable
                  key={stat.key}
                  onPress={async () => {
                    const updated = [...statSlots];
                    updated[editingSlotIndex] = stat.key;
                    setStatSlots(updated);
                    setStatModalVisible(false);

                    try {
                      const { error } = await supabase
                        .from('Players')
                        .update({ displayed_stats: updated })
                        .eq('id', playerProfile.id);

                      if (error) throw error;

                      // success toast
                      Toast.show({
                        type: 'success',
                        text1: 'Stats Updated',
                        text2: 'Your displayed stats have been saved successfully.',
                        props: { colorScheme },
                      });

                      // invalidate query so UI refreshes
                      queryClient.invalidateQueries(['PlayerStats', playerProfile.id]);
                    } catch (err) {
                      console.error('Error updating displayed stats:', err);
                      Toast.show({
                        type: 'error',
                        text1: 'Update Failed',
                        text2: 'There was a problem saving your stats. Please try again.',
                        props: { colorScheme },
                      });
                    }
                  }}
                  className="mb-3 flex flex-row rounded-xl bg-bg-grouped-1 p-4">
                  <Text className="flex-1 font-saira text-lg text-text-1">{stat.label}</Text>
                  <Text className="text-right font-saira-medium text-lg text-text-1">
                    {stat.value}
                    {stat.label.includes('%') ? '%' : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setStatModalVisible(false)}
              className="m-4 mt-0 rounded-2xl border border-theme-red-hc bg-theme-red p-4">
              <Text className="text-center font-saira-semibold text-lg text-white">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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
