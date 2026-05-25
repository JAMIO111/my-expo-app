import ConfirmModal from '@components/ConfirmModal';
import { ScrollView, View, Text, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useUser } from '@contexts/UserProvider';
import { getAgeInYearsAndDays, isBirthdayToday } from '@lib/helperFunctions';
import CTAButton from '@components/CTAButton';
import Heading from '@components/Heading';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import LoadingScreen from '@components/LoadingScreen';
import StatCard from '@components/StatCard';
import CachedImage from '@components/CachedImage';
import { usePlayerStats } from '@hooks/usePlayerStats';
import TrophyCabinet from './TrophyCabinet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import BottomSheetModal from '@components/BottomSheetModal';
import SelectStatMenu from './SelectStatMenu';
import PlayerProfileHeader from './PlayerProfileHeader';

const PlayerProfile = ({ context, isLoading, playerProfile, error }) => {
  const router = useRouter();
  const { fixtureId, teamId, userId } = useLocalSearchParams();

  const colorScheme = useColorScheme();
  const queryClient = useQueryClient();
  const [captainModalVisible, setCaptainModalVisible] = useState(false);
  const [viceCaptainModalVisible, setViceCaptainModalVisible] = useState(false);
  const [removePlayerModalVisible, setRemovePlayerModalVisible] = useState(false);
  const { refetch, loading, currentRole, player } = useUser();
  const {
    data: playerStats,
    isLoading: isLoadingPlayerStats,
    error: playerStatsError,
  } = usePlayerStats(playerProfile?.id);
  const EMPTY_SLOTS = [null, null, null, null];
  const [statSlots, setStatSlots] = useState(EMPTY_SLOTS);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [statModalVisible, setStatModalVisible] = useState(false);

  console.log('Player Profile:', playerProfile);
  console.log('Player Profile Stats:', playerStats);

  const currentTeam =
    context === 'teams'
      ? playerProfile.teams.find((t) => t.team_id === currentRole?.team?.id)
      : playerProfile.teams.find((t) => t.team_id === teamId) || null;
  console.log('Current Teams:', playerProfile.teams);
  const inMyTeam = currentTeam?.team_id === currentRole?.team?.id;
  const isMe = playerProfile?.id === player?.id;
  const iAmCaptain = currentRole?.team?.captain === player?.id;
  const iAmViceCaptain = currentRole?.team?.vice_captain === player?.id;
  const playerIsCaptain = currentTeam?.captain === playerProfile?.id;
  const playerIsViceCaptain = currentTeam?.vice_captain === playerProfile?.id;

  console.log('Current Team:', currentTeam);
  console.log('In My Team:', inMyTeam);
  console.log('I am Captain:', iAmCaptain);
  console.log('I am Vice Captain:', iAmViceCaptain);
  console.log('Player is Captain:', playerIsCaptain);
  console.log('Player is Vice Captain:', playerIsViceCaptain);

  useEffect(() => {
    if (playerStats?.playerMeta?.displayed_stats.length) {
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
        <PlayerProfileHeader playerProfile={playerProfile} currentTeam={currentTeam} />

        <View className="w-full bg-bg-grouped-2 px-2 py-6">
          <Heading className="pl-3" text="Showcase Stats" />
          <View className="mt-2 gap-4 px-2">
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
                    isLoading={isLoadingPlayerStats}
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
                    isLoading={isLoadingPlayerStats}
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
                icon={<Ionicons name="shield-checkmark-outline" size={20} color="black" />}
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
                  icon={<Ionicons name="shield-checkmark-outline" size={20} color="white" />}
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
                icon={<Ionicons name="person-remove-outline" size={20} color="white" />}
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
          <Text className="pt-2 text-center font-saira text-xs text-text-2">{`Player ID: ${playerProfile?.id}`}</Text>
        </View>
      </ScrollView>
      <BottomSheetModal
        showModal={statModalVisible}
        setShowModal={setStatModalVisible}
        title={`Editing Slot ${editingSlotIndex !== null ? editingSlotIndex + 1 : ''}`}>
        <SelectStatMenu
          context="player"
          statOptions={statOptions}
          statSlots={statSlots}
          editingSlotIndex={editingSlotIndex}
          setStatSlots={setStatSlots}
          setStatModalVisible={setStatModalVisible}
          profile={playerProfile}
        />
      </BottomSheetModal>
    </>
  );
};

export default PlayerProfile;
