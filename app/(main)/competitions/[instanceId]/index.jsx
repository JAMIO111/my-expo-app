import { useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, Pressable, useColorScheme } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
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
import {
  checkEligibility,
  formatCompetitionType,
  formatAgeRestrictions,
} from '@components/CompetitionInstanceCard';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Crown,
  Ban,
  CircleStar,
  ShieldCheck,
  DoorClosedLocked,
  ScrollText,
  Clock3,
  Users,
  CircleX,
  UserRoundCheck,
  UserRoundX,
  LogOut,
  DoorOpen,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import BottomSheetWrapper from '@/components/BottomSheetWrapper';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import KnockoutBracket from '@components/KnockoutBracket';
import ExpandableView from '@components/ExpandableView';
import { useKnockoutBracket } from '@hooks/useKnockoutBracket';
import PressableScale from '@components/PressableScale';
import { CalendarClock } from 'lucide-react-native/icons';

export function getStatusColors(status) {
  switch (status) {
    case 'removed':
    case 'closed':
    case 'left':
      return { background: '#FF000022', text: '#FF0000', border: '#FF000066' }; // Red
    case 'closed':
      return { background: '#FF000022', text: '#FF0000', border: '#FF000066' }; // Red
    case 'active':
      return { background: '#00800022', text: '#008000', border: '#00800066' }; // Green
    case 'champion':
    case 'requested':
      return { background: '#FFA50022', text: '#ff9100', border: '#ff910066' }; // Orange
    case 'eliminated':
      return { background: '#FF000022', text: '#FF0000', border: '#FF000066' }; // Red
    case 'runner_up':
      return { background: '#C0C0C044', text: '#666', border: '#C0C0C088' }; // Silver
    default:
      return { background: '#00000022', text: '#000000', border: '#00000066' }; // Default to black
  }
}

const formatStatus = (status) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const index = () => {
  const bottomSheetRef = useRef(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [sheetConfig, setSheetConfig] = useState(null);
  const [internalSheetConfig, setInternalSheetConfig] = useState(null); // to hold content during animation
  const [selectedRewardType, setSelectedRewardType] = useState(null); // 'winner' or 'runnerUp'
  const [selectedReward, setSelectedReward] = useState(null);
  const [showDetails, setShowDetails] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showFixtures, setShowFixtures] = useState(false);
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const { loading, currentRole, player } = useUser();
  const { instanceId } = useLocalSearchParams();
  const { data: competitionInstance, error, isLoading } = useCompetitionInstanceDetails(instanceId);
  const {
    data: knockoutBracket,
    isLoading: knockoutLoading,
    error: knockoutError,
  } = useKnockoutBracket(instanceId);
  const trophyIconMap = Object.fromEntries(trophyIcons.map((t) => [t.key, t]));
  const winnerTrophy = trophyIconMap[competitionInstance?.winner_reward];
  const runnerUpTrophy = trophyIconMap[competitionInstance?.runner_up_reward];

  const deadline = competitionInstance?.entry_deadline
    ? new Date(competitionInstance.entry_deadline)
    : null;
  if (deadline) deadline.setHours(23, 59, 59, 999);

  const isAdmin =
    currentRole?.type === 'admin' &&
    currentRole?.district?.id === competitionInstance?.competition?.district_id;

  const isCaptain = currentRole?.team?.captain === player.id;

  const isTeam = competitionInstance?.competition?.competitor_type === 'team';

  const canJoin =
    competitionInstance?.status === 'upcoming' &&
    (deadline ? deadline >= new Date() : true) &&
    (!isTeam || isCaptain);

  const entryType = competitionInstance;

  const finalStage =
    knockoutBracket?.stages?.[knockoutBracket.stages.length - 1]?.status === 'active';

  const competitionComplete = competitionInstance?.status === 'completed';

  const statusOrder = {
    champion: 0,
    runner_up: 1,
    active: 2,
    eliminated: 3,
  };

  const showSheet = (config) => {
    setSheetConfig(config);
    setInternalSheetConfig(config);
  };

  const hideSheet = () => {
    setSheetConfig(null);
  };

  const visibleParticipants = competitionInstance?.CompetitionParticipants.filter((p) => {
    const isOwn = p.team_id === currentRole?.team?.id || p.player_id === player?.id;

    if (isAdmin) return true;

    const publicStatuses = ['active', 'eliminated', 'champion', 'runner_up'];

    return publicStatuses.includes(p.status) || (p.status === 'requested' && isOwn);
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

  const insertParticipant = async () => {
    if (queryLoading) return;

    try {
      setQueryLoading(true);

      const { error } = await supabase.rpc('join_competition', {
        p_instance_id: instanceId,
        ...(isTeam ? { p_team_id: currentRole.team.id } : { p_player_id: player.id }),
      });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Joined Competition',
        text2: 'You have successfully joined the competition.',
      });

      queryClient.invalidateQueries(['CompetitionInstanceDetails', instanceId]);
      queryClient.invalidateQueries(['CompetitionInstances']);
    } catch (err) {
      const msg = err?.message ?? '';

      const messages = {
        INSTANCE_NOT_FOUND: 'This competition could not be found.',
        REGISTRATION_CLOSED: 'Registration has closed for this competition.',
        COMPETITION_FULL: 'This competition is now full.',
        NOT_CAPTAIN: 'Only the team captain can join this competition.',
        ALREADY_PARTICIPATING: 'You are already participating in this competition.',
        TEAM_TOO_LARGE: 'Your team has too many players for this competition.',
        TEAM_TOO_SMALL: 'Your team does not have enough players for this competition.',
        TEAM_GENDER_MISMATCH:
          'All team players must match the gender requirement for this competition.',
        TEAM_PLAYER_TOO_YOUNG: 'One or more team players do not meet the minimum age requirement.',
        TEAM_PLAYER_TOO_OLD: 'One or more team players exceed the maximum age requirement.',
        UNAUTHORIZED: 'You are not authorised to join this competition.',
        GENDER_MISMATCH: 'You do not meet the gender requirement for this competition.',
        PLAYER_TOO_YOUNG: 'You do not meet the minimum age requirement for this competition.',
        PLAYER_TOO_OLD: 'You exceed the maximum age requirement for this competition.',
      };

      Toast.show({
        type: 'error',
        text1: messages[msg] ? 'Unable to Join' : 'Unexpected Error',
        text2: messages[msg] ?? 'An unexpected error occurred. Please try again.',
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
          status:
            status === 'active' ? (currentRole.type === 'admin' ? 'removed' : 'left') : 'cancelled',
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
      await queryClient.invalidateQueries(['CompetitionInstanceDetails', instanceId]);
      await queryClient.invalidateQueries(['knockout-bracket', instanceId]);
      await queryClient.invalidateQueries(['CompetitionInstances']);

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
        .update({ status: 'closed' })
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

  const handleCloseEntriesPress = () => {
    const deadline = competitionInstance?.entry_deadline;

    // No deadline or deadline has already passed
    if (!deadline || new Date() >= new Date(deadline)) {
      showSheet({
        title: 'Close Competition Entries',
        message:
          'Are you sure you want to close the entries for this competition? No more participants will be able to join.',
        confirmText: 'Close Entries',
        confirmType: 'error',
        onConfirm: handleCloseEntries,
      });
      return;
    }

    // Deadline hasn't been reached yet
    showSheet({
      title: 'Close Entries Early?',
      message: `The entry deadline is ${new Date(deadline).toLocaleDateString()}. Closing entries now will prevent participants from joining before the deadline. Are you sure you want to continue?`,
      confirmText: 'Close Early',
      confirmType: 'error',
      onConfirm: () => {
        showSheet({
          title: 'Close Competition Entries',
          message:
            'Are you sure you want to close the entries for this competition? No more participants will be able to join.',
          confirmText: 'Close Entries',
          confirmType: 'error',
          onConfirm: handleCloseEntries,
        });
      },
    });
  };

  const handleGenerateFixtures = async () => {
    if (queryLoading) return;
    try {
      setQueryLoading(true);
      const { error } = await supabase.rpc('generate_knockout_bracket', {
        p_competition_instance_id: instanceId,
      });

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

  const progressStage = async (compInstanceId) => {
    if (queryLoading) return;
    try {
      setQueryLoading(true);
      const { error } = await supabase.rpc('progress_stage', {
        p_competition_instance_id: compInstanceId,
      });

      if (error) {
        // 🔥 parse backend payload
        let details = null;

        try {
          details = error.details ? JSON.parse(error.details) : null;
        } catch {
          details = null;
        }

        Toast.show({
          type: 'info',
          text1: details?.title || error.message || 'Error',
          text2: details?.reason || 'Something went wrong',
        });

        return;
      }

      queryClient.invalidateQueries({
        queryKey: ['knockout-bracket', compInstanceId],
      });
      queryClient.invalidateQueries(['CompetitionInstanceDetails', instanceId]);
    } catch (err) {
      // 🔥 truly unexpected (network, runtime, etc.)

      Toast.show({
        type: 'error',
        text1: 'Unexpected error',
        text2: 'Please check your connection and try again.',
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
            contentContainerStyle={{ display: 'flex', flexGrow: 1, gap: 12 }}
            className="mt-16 flex-1 bg-bg-2 p-3">
            <View className="gap-2">
              <ExpandableView
                title="Competition Details"
                show={showDetails}
                setShow={setShowDetails}>
                <View className="flex-row pt-2">
                  <View className="flex-1 gap-3">
                    <View>
                      <Text className="px-1 font-saira text-lg text-text-2">
                        Competition Format
                      </Text>
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
                        {competitionInstance?.competition?.competitor_type
                          .slice(0, 1)
                          .toUpperCase() +
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
              </ExpandableView>
              {canJoin &&
                checkEligibility(player, competitionInstance, currentRole).status ===
                  'Eligible' && (
                  <View className="p-4 pt-0">
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
                  </View>
                )}
              {isAdmin &&
                (competitionInstance?.status === 'upcoming' ||
                  competitionInstance?.status === 'closed') && (
                  <View className="py-2">
                    <CTAButton
                      lucideIcon={
                        competitionInstance?.status === 'upcoming' ? (
                          <DoorClosedLocked size={24} color="white" />
                        ) : competitionInstance?.status === 'closed' ? (
                          <ScrollText size={24} color="black" />
                        ) : null
                      }
                      type={
                        competitionInstance?.status === 'upcoming'
                          ? 'error'
                          : competitionInstance?.status === 'closed'
                            ? 'yellow'
                            : 'yellow'
                      }
                      text={
                        competitionInstance?.status === 'upcoming'
                          ? 'Close Entries'
                          : competitionInstance?.status === 'closed'
                            ? 'Generate Fixtures'
                            : ''
                      }
                      callbackFn={
                        competitionInstance?.status === 'upcoming'
                          ? handleCloseEntriesPress
                          : competitionInstance?.status === 'closed'
                            ? handleGenerateFixtures
                            : null
                      }
                    />
                  </View>
                )}
            </View>
            <View className="gap-2">
              <ExpandableView
                title="Fixtures"
                show={showFixtures}
                setShow={setShowFixtures}
                fixedClosed={
                  competitionInstance?.status === 'upcoming' ||
                  competitionInstance?.status === 'closed'
                }
                fixedClosedComponent={
                  <View className="flex-row items-center gap-2 rounded-lg bg-bg-2 p-2 px-3">
                    <CalendarClock size={20} color="#777" />
                    <Text className="font-saira text-lg text-text-2">
                      No Fixtures available yet.
                    </Text>
                  </View>
                }>
                <View style={{ display: showFixtures ? 'flex' : 'none' }}>
                  {competitionInstance?.status === 'active' ||
                  competitionInstance?.status === 'completed' ? (
                    (() => {
                      switch (competitionInstance?.competition?.competition_type) {
                        case 'knockout':
                          return (
                            <View className="mb-2 gap-5">
                              <KnockoutBracket competitionInstanceId={instanceId} />
                              {isAdmin && competitionInstance?.status === 'active' && (
                                <CTAButton
                                  text={finalStage ? 'End Competition' : 'Proceed to Next Round'}
                                  type="yellow"
                                  disabled={isLoading || queryLoading}
                                  callbackFn={() => progressStage(instanceId)}
                                />
                              )}
                            </View>
                          );
                        default:
                          return (
                            <Text className="pl-1 font-saira-medium text-xl text-text-2">
                              No Fixtures available yet.
                            </Text>
                          );
                      }
                    })()
                  ) : (
                    <Text className="pl-1 font-saira-medium text-xl text-text-2">
                      No Fixtures available yet.
                    </Text>
                  )}
                </View>
              </ExpandableView>
            </View>
            <View>
              <ExpandableView
                title="Participants"
                show={showParticipants}
                setShow={setShowParticipants}
                fixedClosed={visibleParticipants?.length === 0}
                fixedClosedComponent={
                  <View className="flex-row items-center gap-2 rounded-lg bg-bg-2 p-2 px-3">
                    <Users size={20} color="#777" />
                    <Text className="font-saira text-lg text-text-2">No Participants yet.</Text>
                  </View>
                }>
                <View className="gap-1">
                  {visibleParticipants?.length === 0 ? (
                    <Text className="px-1 font-saira-medium text-xl text-text-2">
                      No participants yet
                    </Text>
                  ) : (
                    visibleParticipants
                      ?.sort((a, b) => {
                        return (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999);
                      })
                      .map((entity, idx) => {
                        const lastItem = idx === visibleParticipants.length - 1;

                        const participant = entity.team || entity.player;

                        console.log('Participant:', participant, 'Entity:', entity);

                        const participantName =
                          participant.display_name ||
                          `${participant.first_name} ${participant.surname}`;

                        const isMe = participant.id === player.id;

                        const isMyParentTeam = isTeam && entity.team_id === currentRole?.team?.id;

                        const isMyChildTeam =
                          isTeam &&
                          currentRole?.compTeams?.some((team) => team.id === entity.team_id);

                        console.log(
                          'isMyParentTeam:',
                          isMyParentTeam,
                          'isMyChildTeam:',
                          isMyChildTeam,
                          'isMe:',
                          isMe
                        );

                        const isMyTeam = isMyParentTeam || isMyChildTeam;

                        const statusColors = getStatusColors(entity.status);
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
                              ellipsizeMode="middle"
                              className="flex-1 px-1 font-saira-medium text-lg text-text-1">
                              {participantName}
                            </Text>
                            <View
                              className="flex-row items-center justify-center"
                              style={{
                                backgroundColor: statusColors.background,
                                borderColor: statusColors.border,
                                borderWidth: 1,
                                borderRadius: 6,
                                padding: 2,
                              }}>
                              {entity.status === 'champion' && <Crown size={16} color="#ff9100" />}
                              {entity.status === 'runner_up' && (
                                <CircleStar size={16} color="#666" />
                              )}
                              {entity.status === 'eliminated' && <Ban size={16} color="#FF0000" />}
                              {entity.status === 'active' && (
                                <ShieldCheck size={16} color={statusColors.text} />
                              )}
                              {entity.status === 'requested' && (
                                <Clock3 size={16} color={statusColors.text} />
                              )}
                              <Text
                                style={{
                                  color: statusColors.text,
                                }}
                                className="px-2 font-saira-medium text-sm text-text-2">
                                {formatStatus(entity.status)}
                              </Text>
                            </View>

                            {competitionInstance?.status !== 'completed' &&
                              ((isMyTeam && currentRole.team?.captain === player.id) || isMe) &&
                              !isAdmin && (
                                <PressableScale
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
                                  {entity.status === 'requested' ? (
                                    <CircleX size={26} color="#FF0000" />
                                  ) : (
                                    <LogOut size={26} color="#FF0000" />
                                  )}
                                </PressableScale>
                              )}
                            {isAdmin && (
                              <View className="flex-row items-center gap-3">
                                {entity.status === 'requested' && (
                                  <>
                                    <PressableScale
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
                                      <UserRoundCheck size={24} color="#008000" />
                                    </PressableScale>

                                    <PressableScale
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
                                      <UserRoundX size={24} color="#FF0000" />
                                    </PressableScale>
                                  </>
                                )}

                                {entity.status === 'active' && (
                                  <PressableScale
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
                                    <LogOut size={26} color="#FF0000" />
                                  </PressableScale>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })
                  )}
                </View>
              </ExpandableView>
            </View>
            <View
              style={{ minHeight: 360 }}
              className="rounded-2xl border border-theme-gray-5 bg-bg-1 p-4 pb-8">
              <Text className="font-tektur-semibold pb-4 text-2xl text-text-1">
                Competition Awards
              </Text>
              <View className="flex-row items-stretch justify-around gap-5">
                <Pressable
                  onPress={() => isAdmin && !competitionComplete && openSheet('winner')}
                  className={`flex-1 flex-col items-center justify-end rounded-2xl ${isAdmin && !competitionComplete ? 'border-2 border-dashed border-theme-gray-4' : ''}`}>
                  <View className="flex-1 flex-col items-center justify-end">
                    {competitionInstance?.winner_reward === null ? (
                      <View className="h-30 w-30 mb-4 flex-1 items-center justify-center rounded-2xl">
                        <Ionicons
                          name={isAdmin ? 'add' : 'sad-outline'}
                          size={120}
                          color={isAdmin ? '#000000' : '#FF000088'}
                        />
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
                  onPress={() => isAdmin && !competitionComplete && openSheet('runnerUp')}
                  className={`flex-1 flex-col items-center justify-end rounded-2xl ${isAdmin && !competitionComplete ? 'border-2 border-dashed border-theme-gray-4' : ''}`}>
                  <View className="flex-1 flex-col items-center justify-end">
                    {competitionInstance?.runner_up_reward === null ? (
                      <View className="mb-4 flex-1 items-center justify-center rounded-2xl">
                        <Ionicons
                          name={isAdmin ? 'add' : 'sad-outline'}
                          size={120}
                          color={isAdmin ? '#000000' : '#FF000088'}
                        />
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
            <View className="mb-16 gap-3 rounded-2xl border border-theme-gray-5 bg-bg-1 p-4">
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-center font-saira-medium text-sm text-text-2">
                Competition ID: {competitionInstance?.id}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-center font-saira-medium text-sm text-text-2">
                Initiated at:{' '}
                {competitionInstance?.created_at
                  ? new Date(competitionInstance.created_at).toLocaleString()
                  : 'N/A'}
              </Text>
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
