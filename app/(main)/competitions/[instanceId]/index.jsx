import { useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useCompetitionInstanceDetails } from '@hooks/useCompetitionInstanceDetails';
import { trophyIcons } from '@lib/badgeIcons';
import Avatar from '@components/Avatar';
import TeamLogo from '@components/TeamLogo';
import LoadingScreen from '@components/LoadingScreen';
import CTAButton from '@components/CTAButton';
import { supabase } from '@lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import colors from '@lib/colors';
import { useColorScheme } from 'react-native';
import {
  checkEligibility,
  formatCompetitionType,
  formatAgeRestrictions,
} from '@components/CompetitionInstanceCard';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import BottomSheetWrapper from '@/components/BottomSheetWrapper';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

const index = () => {
  const bottomSheetRef = useRef(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [sheetConfig, setSheetConfig] = useState(null);
  const [internalSheetConfig, setInternalSheetConfig] = useState(null); // to hold content during animation
  const [selectedRewardType, setSelectedRewardType] = useState(null); // 'winner' or 'runnerUp'
  const [selectedReward, setSelectedReward] = useState(null);
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const { loading, currentRole, player } = useUser();
  const { instanceId } = useLocalSearchParams();
  const { data: competitionInstance, error, isLoading } = useCompetitionInstanceDetails(instanceId);
  const trophyIconMap = Object.fromEntries(trophyIcons.map((t) => [t.key, t]));
  const winnerTrophy = trophyIconMap[competitionInstance?.winner_reward];
  const runnerUpTrophy = trophyIconMap[competitionInstance?.runner_up_reward];

  const deadline = competitionInstance?.entry_deadline
    ? new Date(competitionInstance.entry_deadline)
    : null;
  if (deadline) deadline.setHours(23, 59, 59, 999);

  const isCaptain = currentRole?.team?.captain === player.id;

  const isTeam = competitionInstance?.competition?.competitor_type === 'team';

  const canJoin =
    competitionInstance?.status === 'upcoming' && deadline >= new Date() && (!isTeam || isCaptain);

  const entryType = competitionInstance?.entry_type;

  const showSheet = (config) => {
    setSheetConfig(config);
    setInternalSheetConfig(config);
  };

  const hideSheet = () => {
    setSheetConfig(null);
  };

  const visibleParticipants = competitionInstance?.CompetitionParticipants.filter((p) => {
    const isVisibleStatus = p.status === 'active' || p.status === 'requested';

    // Admins see everything (based on status only)
    if (currentRole?.role === 'admin') {
      return isVisibleStatus;
    }

    // Non-admins: restrict to own team/player
    const isOwnEntry = p.team_id === currentRole?.team?.id || p.player_id === player?.id;

    return isVisibleStatus && isOwnEntry;
  });

  console.log('Competition Instance Details:', competitionInstance);

  const openSheet = (type) => {
    setSelectedRewardType(type);
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const selectReward = (reward) => {
    setSelectedReward(reward);
    closeSheet();
  };

  const updateReward = async (reward) => {
    // ✅ accept reward as param
    if (queryLoading) return;
    try {
      setQueryLoading(true);
      const payload =
        selectedRewardType === 'winner'
          ? { winner_reward: reward?.key || null }
          : { runner_up_reward: reward?.key || null };

      const { error } = await supabase
        .from('CompetitionInstances')
        .update(payload)
        .eq('id', competitionInstance.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Reward Updated',
        text2: 'The reward has been successfully updated.',
      });

      queryClient.invalidateQueries(['CompetitionInstanceDetails', instanceId]);
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Unexpected Error',
        text2: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const insertParticipant = async ({ status, dateField }) => {
    if (queryLoading) return; // prevent spam taps

    // Captain check
    if (isTeam && status === 'requested' && !isCaptain) {
      alert('Only team captains can join this competition. Please ask your captain to join.');
      return;
    }

    try {
      setQueryLoading(true);

      const payload = {
        competition_instance_id: instanceId,
        status,
        [dateField]: new Date().toISOString(),
        ...(isTeam ? { team_id: currentRole.team.id } : { player_id: player.id }),
      };

      const { error } = await supabase.from('CompetitionParticipants').insert(payload);

      if (error) throw error;

      // ✅ Success toast
      // Replace with your toast lib if you have one
      Toast.show({
        type: 'success',
        text1: status === 'active' ? 'Joined Competition' : 'Request Sent',
        text2:
          status === 'active'
            ? 'You have successfully joined the competition.'
            : 'Your request to join has been sent to the admin.',
      });

      // ✅ Invalidate queries
      queryClient.invalidateQueries(['CompetitionInstanceDetails', instanceId]);
      queryClient.invalidateQueries(['CompetitionInstances']);
    } catch (err) {
      console.error(err);

      // ❌ Error toast
      Toast.show({
        type: 'error',
        text1: 'Unexpected Error',
        text2: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setSheetConfig(null);
      setQueryLoading(false);
    }
  };

  const joinCompetition = () => insertParticipant({ status: 'active', dateField: 'joined_at' });

  const requestToJoin = () => insertParticipant({ status: 'requested', dateField: 'requested_at' });

  const handleWithdraw = async (status) => {
    if (queryLoading) return;

    try {
      setQueryLoading(true);

      const { error } = await supabase
        .from('CompetitionParticipants')
        .update({
          status: status === 'active' ? 'left' : 'cancelled',
          left_at: new Date().toISOString(),
        })
        .eq('competition_instance_id', instanceId)
        .match(
          isTeam ? { team_id: currentRole.team.id, status } : { player_id: player.id, status }
        );

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: status === 'active' ? 'Left Competition' : 'Request Cancelled',
        text2:
          status === 'active'
            ? 'You have successfully left the competition.'
            : 'Your request to join has been cancelled.',
      });

      queryClient.invalidateQueries(['CompetitionInstanceDetails', instanceId]);
      queryClient.invalidateQueries(['CompetitionInstances']);
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Unexpected Error',
        text2: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setSheetConfig(null);
      setQueryLoading(false);
    }
  };

  const handleParticipantAction = async (entity, action) => {
    if (queryLoading) return; // prevent spam taps
    try {
      if (!entity?.id) return;
      setQueryLoading(true);

      if (action === 'accept') {
        const { error } = await supabase
          .from('CompetitionParticipants')
          .update({
            status: 'active',
            joined_at: new Date().toISOString(),
          })
          .eq('id', entity.id);

        if (error) throw error;
      }

      if (action === 'deny') {
        const { error } = await supabase
          .from('CompetitionParticipants')
          .delete()
          .eq('id', entity.id);

        if (error) throw error;
      }

      if (action === 'remove') {
        const { error } = await supabase
          .from('CompetitionParticipants')
          .update({
            status: 'left',
            left_at: new Date().toISOString(),
          })
          .eq('id', entity.id);

        if (error) throw error;
      }

      // refresh data
      queryClient.invalidateQueries(['CompetitionInstanceDetails', instanceId]);
      queryClient.invalidateQueries(['CompetitionInstances']);

      Toast.show({
        type: 'success',
        text1:
          action === 'accept'
            ? 'Participant Accepted'
            : action === 'deny'
              ? 'Participant Denied'
              : 'Participant Removed',
        text2:
          action === 'accept'
            ? 'The participant has been accepted into the competition.'
            : action === 'deny'
              ? "The participant's request has been denied."
              : 'The participant has been removed from the competition.',
      });
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: 'An error occurred while processing this action. Please try again.',
      });
    } finally {
      setSheetConfig(null);
      setQueryLoading(false);
    }
  };

  const handleCloseEntries = async () => {
    if (queryLoading) return;
    try {
      setQueryLoading(true);
      const { error } = await supabase
        .from('CompetitionInstances')
        .update({ status: 'active' })
        .eq('id', instanceId);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Entries Closed',
        text2: 'The competition entries have been successfully closed.',
      });

      queryClient.invalidateQueries(['CompetitionInstanceDetails', instanceId]);
      queryClient.invalidateQueries(['CompetitionInstances']);
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: 'An error occurred while closing the entries. Please try again.',
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleGenerateFixtures = async () => {
    if (queryLoading) return;
    try {
      setQueryLoading(true);
      const { error } = await supabase.rpc('generate_fixtures', { comp_instance_id: instanceId });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Fixtures Generated',
        text2: 'The competition fixtures have been successfully generated.',
      });

      queryClient.invalidateQueries(['CompetitionInstanceDetails', instanceId]);
      queryClient.invalidateQueries(['CompetitionInstances']);
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: 'An error occurred while generating the fixtures. Please try again.',
      });
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title={competitionInstance?.name || 'Competition'} />
            </SafeViewWrapper>
          ),
        }}
      />
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
          <ScrollView
            contentContainerStyle={{ display: 'flex', flexGrow: 1, gap: 6 }}
            className="mt-16 flex-1 bg-bg-2">
            <View className="gap-6 bg-bg-1 p-4">
              <Text className="px-1 font-saira-medium text-2xl text-text-1">
                Competition Details
              </Text>
              <View className="flex-row">
                <View className="flex-1 gap-3">
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Competition Format</Text>
                    <Text className="px-1 font-saira text-xl text-text-1">
                      {formatCompetitionType(competitionInstance?.competition?.competition_type)}
                    </Text>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Gender</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="px-1 font-saira text-xl text-text-1">
                        {competitionInstance?.gender.slice(0, 1).toUpperCase() +
                          competitionInstance?.gender.slice(1)}
                      </Text>
                      {competitionInstance?.gender === 'male' && (
                        <Ionicons name="male" size={20} color="#0085E5" />
                      )}
                      {competitionInstance?.gender === 'female' && (
                        <Ionicons name="female" size={20} color="#FF69B4" />
                      )}
                    </View>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">
                      Division Requirement
                    </Text>
                    <Text className="px-1 font-saira text-xl text-text-1">
                      {formatCompetitionType(competitionInstance?.division?.name || 'None')}
                    </Text>
                  </View>
                </View>
                <View className="flex-1 gap-3">
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Competitor Type</Text>
                    <Text className="px-1 font-saira text-xl text-text-1">
                      {competitionInstance?.competition?.competitor_type.slice(0, 1).toUpperCase() +
                        competitionInstance?.competition?.competitor_type.slice(1)}
                    </Text>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Age Restriction</Text>
                    <Text className="px-1 font-saira text-xl text-text-1">
                      {formatAgeRestrictions(
                        competitionInstance?.min_age,
                        competitionInstance?.max_age
                      ) || 'None'}
                    </Text>
                  </View>
                </View>
              </View>
              {canJoin &&
                currentRole?.role !== 'admin' &&
                checkEligibility(player, competitionInstance, currentRole) === 'Eligible' && (
                  <CTAButton
                    callbackFn={() => {
                      showSheet({
                        title: entryType === 'request' ? 'Request to Join' : 'Join Competition',
                        message:
                          entryType === 'request'
                            ? 'Are you sure you want to request to join this competition?'
                            : 'Are you sure you want to join this competition?',
                        confirmText:
                          entryType === 'request' ? 'Request to Join' : 'Join Competition',
                        confirmType: 'success',
                        onConfirm: entryType === 'request' ? requestToJoin : joinCompetition,
                      });
                    }}
                    text={
                      entryType === 'open'
                        ? 'Join Competition'
                        : entryType === 'request'
                          ? 'Request to Join'
                          : 'Join Competition'
                    }
                    type="yellow"
                    icon={
                      <Ionicons name="log-in-outline" className="mb-1" size={26} color="black" />
                    }
                  />
                )}
              {currentRole?.role === 'admin' && (
                <CTAButton
                  type={
                    competitionInstance?.status === 'upcoming'
                      ? 'error'
                      : competitionInstance?.status === 'active'
                        ? 'yellow'
                        : 'yellow'
                  }
                  text={
                    competitionInstance?.status === 'upcoming'
                      ? 'Close Entries'
                      : competitionInstance?.status === 'active'
                        ? 'Generate Fixtures'
                        : ''
                  }
                  callbackFn={
                    competitionInstance?.status === 'upcoming'
                      ? () =>
                          showSheet({
                            title: 'Close Competition Entries',
                            message:
                              'Are you sure you want to close the entries for this competition? No more participants will be able to join.',
                            confirmText: 'Close Entries',
                            confirmType: 'error',
                            onConfirm: handleCloseEntries,
                          })
                      : competitionInstance?.status === 'active'
                        ? handleGenerateFixtures
                        : null
                  }
                />
              )}
            </View>
            <View className="bg-bg-1 p-4">
              <Text className="px-1 pb-4 font-saira-medium text-2xl text-text-1">
                Competition Participants
              </Text>
              <View className="gap-1">
                {visibleParticipants?.length === 0 ? (
                  <Text className="px-1 font-saira text-xl text-text-2">No participants yet</Text>
                ) : (
                  visibleParticipants?.map((entity, idx) => {
                    const lastItem = idx === visibleParticipants.length - 1;
                    const participant = entity.team || entity.player;
                    const participantName =
                      participant.display_name ||
                      `${participant.first_name} ${participant.surname}`;
                    const isMe = participant.id === player.id;
                    const isMyTeam = isTeam && entity.team_id === currentRole?.team?.id;
                    return (
                      <View
                        key={participant.id}
                        className={`flex-row items-center gap-3 px-1 py-2 pb-3 ${!lastItem ? 'border-b border-theme-gray-5' : ''}`}>
                        {entity.team ? (
                          <TeamLogo
                            type={participant.crest.type}
                            color1={participant.crest.color1}
                            color2={participant.crest.color2}
                            thickness={participant.crest.thickness}
                            size={28}
                          />
                        ) : (
                          <Avatar player={participant} size={32} />
                        )}
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          className="flex-1 px-1 font-saira-medium text-lg text-text-1">
                          {participantName}
                        </Text>
                        {entity.status === 'requested' && (
                          <Text
                            style={{
                              backgroundColor: '#FFA50033',
                              borderColor: '#FFA50066',
                              color: '#FFA500',
                              borderWidth: 1,
                              borderRadius: 10,
                            }}
                            className="px-2 py-1 font-saira">
                            Requested
                          </Text>
                        )}
                        {(isMyTeam || isMe) && currentRole?.role !== 'admin' && (
                          <Pressable
                            onPress={() => {
                              showSheet({
                                title:
                                  entity.status === 'requested'
                                    ? 'Cancel Join Request'
                                    : 'Leave Competition',
                                message:
                                  entity.status === 'requested'
                                    ? 'Are you sure you want to cancel your join request?'
                                    : 'Are you sure you want to leave this competition? You will not be able to rejoin.',
                                confirmText:
                                  entity.status === 'requested' ? 'Cancel Request' : 'Leave',
                                confirmType: 'error',
                                onConfirm: () => handleWithdraw(entity.status),
                              });
                            }}>
                            <Ionicons
                              name={
                                entity.status === 'requested' ? 'close-outline' : 'exit-outline'
                              }
                              size={26}
                              color="#FF0000"
                            />
                          </Pressable>
                        )}
                        {currentRole?.role === 'admin' && (
                          <View className="flex-row items-center gap-3">
                            {entity.status === 'requested' && (
                              <>
                                <Pressable
                                  onPress={() => {
                                    showSheet({
                                      title: 'Accept Request',
                                      message: `Approve ${participantName} into the competition?`,
                                      confirmText: 'Accept Request',
                                      confirmType: 'success',
                                      onConfirm: async () =>
                                        await handleParticipantAction(entity, 'accept'),
                                    });
                                  }}>
                                  <Ionicons name="checkmark" size={28} color="#008000" />
                                </Pressable>

                                <Pressable
                                  onPress={() => {
                                    showSheet({
                                      title: 'Deny Request',
                                      message: `Are you sure you want to deny ${participantName}'s request?`,
                                      confirmText: 'Deny Request',
                                      confirmType: 'error',
                                      onConfirm: async () =>
                                        await handleParticipantAction(entity, 'deny'),
                                    });
                                  }}>
                                  <Ionicons name="close" size={28} color="#FF0000" />
                                </Pressable>
                              </>
                            )}

                            {entity.status === 'active' && (
                              <Pressable
                                onPress={() => {
                                  showSheet({
                                    title: 'Remove Participant',
                                    message: `Remove ${participantName} from the competition?`,
                                    confirmText: 'Remove',
                                    confirmType: 'error',
                                    onConfirm: async () =>
                                      await handleParticipantAction(entity, 'remove'),
                                  });
                                }}>
                                <Ionicons name="exit-outline" size={26} color="#FF0000" />
                              </Pressable>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>
            <View className="bg-bg-1 p-4 pb-8">
              <Text className="px-1 pb-4 font-saira-medium text-2xl text-text-1">
                Competition Awards
              </Text>
              <View className="flex-row items-stretch justify-around gap-5">
                <Pressable
                  onPress={() => openSheet('winner')}
                  className="flex-1 flex-col items-center justify-end rounded-2xl border-2 border-dashed border-theme-gray-4">
                  <View className="flex-1 flex-col items-center justify-end">
                    {competitionInstance?.winner_reward === null ? (
                      <View className="h-30 w-30 mb-4 flex-1 items-center justify-center rounded-2xl">
                        <Ionicons name="add" size={120} color="#000000" />
                      </View>
                    ) : (
                      <Image source={winnerTrophy?.icon} className="h-30 w-30 mb-4" />
                    )}
                    <Text className="ml-2 font-saira-medium text-xl text-text-1">
                      {competitionInstance?.winner_reward ? winnerTrophy?.name : 'No Reward'}
                    </Text>
                    <Text className="ml-2 pb-3 font-saira-medium text-lg text-text-2">WINNER</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => openSheet('runnerUp')}
                  className="flex-1 flex-col items-center justify-end rounded-2xl border-2 border-dashed border-theme-gray-4">
                  <View className="flex-1 flex-col items-center justify-end">
                    {competitionInstance?.runner_up_reward === null ? (
                      <View className="mb-4 flex-1 items-center justify-center rounded-2xl">
                        <Ionicons name="add" size={120} color="#000000" />
                      </View>
                    ) : (
                      <Image source={runnerUpTrophy?.icon} className="h-30 w-30 mb-4" />
                    )}
                    <Text className="ml-2 font-saira-medium text-xl text-text-1">
                      {competitionInstance?.runner_up_reward ? runnerUpTrophy?.name : 'No Reward'}
                    </Text>
                    <Text className="ml-2 pb-3 font-saira-medium text-lg text-text-2">
                      RUNNER UP
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </ScrollView>
          <FloatingBottomSheet
            visible={!!sheetConfig}
            title={internalSheetConfig?.title}
            message={internalSheetConfig?.message}
            topButtonText={internalSheetConfig?.confirmText}
            topButtonType={internalSheetConfig?.confirmType}
            topButtonFn={async () => {
              if (!internalSheetConfig?.onConfirm) return;
              await internalSheetConfig.onConfirm();
              hideSheet();
            }}
            bottomButtonText="Cancel"
            bottomButtonType="default"
            bottomButtonFn={hideSheet}
            onCancel={hideSheet}
            onAnimationEnd={() => setInternalSheetConfig(null)}
          />
        </SafeViewWrapper>
      )}
      <BottomSheetWrapper
        marginTop={140}
        ref={bottomSheetRef}
        initialIndex={-1}
        snapPoints={['80%']}>
        {/* Header */}
        <BottomSheetView
          style={{
            paddingHorizontal: 32,
            paddingTop: 8,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            backgroundColor: themeColors.bgGrouped2,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{ lineHeight: 40, fontSize: 24 }} className="font-saira-medium text-text-1">
            Choose {selectedRewardType === 'winner' ? "Winner's" : "Runner-up's"} award
          </Text>
          <Pressable className="p-2" onPress={closeSheet}>
            <Ionicons name="close" size={24} color={themeColors.primaryText} />
          </Pressable>
        </BottomSheetView>

        {/* Grid of rewards */}
        <BottomSheetScrollView
          className="bg-bg-grouped-1"
          contentContainerStyle={{
            paddingBottom: 200,
            paddingTop: 80,
            paddingHorizontal: 16,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
          {trophyIcons?.map((reward, idx) => {
            const isSelected =
              selectedRewardType === 'winner'
                ? competitionInstance?.winner_reward === reward.key
                : selectedRewardType === 'runnerUp'
                  ? competitionInstance?.runner_up_reward === reward.key
                  : false;
            return (
              <Pressable
                key={idx}
                onPress={() => {
                  selectReward(reward);
                  updateReward(reward);
                }}
                className={`rounded-2xl bg-bg-grouped-2 ${
                  isSelected ? 'border-2 border-brand' : 'shadow-sm'
                }`}
                style={{
                  width: '48%',
                  marginBottom: 20,
                  alignItems: 'center',
                }}>
                <Image
                  source={reward.icon}
                  style={{ width: 80, height: 120, resizeMode: 'contain' }}
                />
                <Text
                  style={{
                    textAlign: 'center',
                    lineHeight: 24,
                    fontSize: 16,
                    marginVertical: 8,
                  }}
                  className="font-saira-medium text-text-1">
                  {reward.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              selectReward(null);
              updateReward(null); // ✅ same fix
            }}
            className={`${
              selectedReward && selectedReward.name === 'No Reward'
                ? 'border-2 border-brand'
                : 'shadow-sm'
            } w-full flex-row items-center justify-center gap-4 rounded-2xl bg-bg-grouped-2 p-6`}
            style={{
              width: '100%',
              marginBottom: 20,
              alignItems: 'center',
            }}>
            <Ionicons name="ban-outline" size={60} color="red" />
            <Text
              style={{
                textAlign: 'center',
                lineHeight: 60,
                fontSize: 36,
                marginVertical: 0,
              }}
              className="font-saira-medium text-text-1">
              No Reward
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
