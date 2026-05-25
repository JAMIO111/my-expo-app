import { StyleSheet, Text, View, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useEffect, useState } from 'react';
import PlayersList from '@components/PlayersList';
import Heading from '@components/Heading';
import TeamLogo from '@components/TeamLogo';
import CTAButton from '@components/CTAButton';
import StatCard from '@components/StatCard';
import CachedImage from '@components/CachedImage';
import { Dimensions } from 'react-native';
import TrophyCabinet from '@components/TrophyCabinet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTeamAwards } from '@hooks/useTeamAwards';
import { trophyIcons } from '../lib/badgeIcons';
import { useLast5Results } from '@hooks/useLast5Results';
import { useTeamStats } from '../hooks/useTeamStats';
import Last5MatchesList from './Last5MatchesList';
import { useTeamPlayers } from '@hooks/useTeamPlayers';
import { useUser } from '@contexts/UserProvider';
import TeamJoinRequests from './TeamJoinRequests';
import BottomSheetModal from './BottomSheetModal';
import SelectStatMenu from './SelectStatMenu';
import TeamProfileHeader from '@components/TeamProfileHeader';

const TeamProfile = ({ context, profile, isLoading }) => {
  const { currentRole, player } = useUser();
  const router = useRouter();
  const { teamId, fixtureId } = useLocalSearchParams();
  const { data: teamAwards, isLoading: isLoadingTeamAwards } = useTeamAwards(profile?.id);
  const { data: last5Results, isLoading: isLoadingLast5Results } = useLast5Results(
    profile?.id,
    'team',
    'matches'
  );
  const { data: teamStats, isLoading: isLoadingTeamStats } = useTeamStats(profile?.id);
  const {
    data: players,
    isLoading: isLoadingPlayers,
    error: playersError,
  } = useTeamPlayers(profile?.id);

  const [viewMatches, setViewMatches] = useState(true);
  const EMPTY_SLOTS = [null, null, null, null];
  const [statSlots, setStatSlots] = useState(EMPTY_SLOTS);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [statModalVisible, setStatModalVisible] = useState(false);

  const safeMatches = (last5Results?.details ?? []).filter(Boolean);
  const { line_1, line_2, city, postcode } = profile?.address || {};

  const trophyIconMap = Object.fromEntries(trophyIcons.map((t) => [t.key, t]));
  const trophies = teamAwards?.map((award) => {
    const trophyDef = trophyIconMap[award.reward];

    return {
      ...award,
      image: trophyDef?.icon ?? null,
    };
  });

  const isMyTeam = currentRole?.team?.id === profile?.id;
  const isCaptain = isMyTeam && player?.id === profile?.captain;
  const isViceCaptain = isMyTeam && player?.id === profile?.vice_captain;

  const canEditStats = isCaptain || isViceCaptain;

  console.log('Team Awards Data:', teamAwards);
  console.log('Last 5 Results in TeamProfile:', last5Results);
  console.log('Team Stats:', teamStats);

  useEffect(() => {
    if (teamStats?.teamMeta?.displayed_stats?.length) {
      setStatSlots(teamStats.teamMeta.displayed_stats);
    }
  }, [teamStats?.teamMeta?.displayed_stats]);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: viewMatches ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [viewMatches]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleViewStats = () => {
    if (context === 'home/league/team') {
      router.push(`home/league/${teamId}/team-stats`);
    } else if (context === 'teams') {
      router.push(`/teams/${currentRole?.team.id}/team-stats`);
    } else if (context === 'home/upcoming-fixture') {
      router.push(`home/${fixtureId}/${teamId}/team-stats`);
    }
  };

  const openStatSelector = (index) => {
    if (!canEditStats) return; // safety check
    setEditingSlotIndex(index);
    setStatModalVisible(true);
  };

  const formatStatLabel = (key) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/Percent\b/, '%');

  const statOptions = Object.entries(teamStats?.totalStats || {}).map(([key, value]) => ({
    key,
    label: formatStatLabel(key),
    value,
  }));

  if (isLoading || !profile)
    return (
      <>
        <Stack.Screen
          options={{
            header: () => (
              <View className="h-16 flex-row items-center justify-center bg-brand"></View>
            ),
          }}
        />
      </>
    );

  return (
    <>
      <ScrollView className="flex-1 bg-bg-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-brand p-3">
          {profile.cover_image_url && (
            <View className="overflow-hidden rounded-2xl">
              <CachedImage
                avatarUrl={profile.cover_image_url}
                userId={profile?.id}
                width={Dimensions.get('window').width - 24}
                height={((Dimensions.get('window').width - 24) * 9) / 16}
                borderRadius={0}
              />
            </View>
          )}
        </View>
        <TeamProfileHeader profile={profile} />
        <View className="gap-1 bg-bg-grouped-1">
          <View className="mt-1 bg-bg-grouped-2 px-4 py-6">
            <Heading text="Team Stats" />
            <View className="gap-5 pt-3">
              <View className="flex-row gap-4">
                {statSlots.slice(0, 2).map((slotKey, index) => {
                  const stat = statOptions?.find((s) => s.key === slotKey);

                  const isLoading = !statOptions || isLoadingTeamStats;

                  return (
                    <StatCard
                      key={index}
                      title={stat?.label || '—'}
                      value={stat?.value ?? 0}
                      onPress={() => openStatSelector(index)}
                      disabled={!canEditStats || isLoading}
                      isLoading={isLoadingTeamStats}
                    />
                  );
                })}
              </View>

              <View className="flex-row gap-4">
                {statSlots.slice(2, 4).map((slotKey, index) => {
                  const stat = statOptions?.find((s) => s.key === slotKey);

                  const isLoading = !statOptions || isLoadingTeamStats;

                  return (
                    <StatCard
                      key={index + 2}
                      title={stat?.label || '—'}
                      value={stat?.value ?? 0}
                      onPress={() => openStatSelector(index + 2)}
                      disabled={!canEditStats || isLoading}
                      isLoading={isLoadingTeamStats}
                    />
                  );
                })}
              </View>
              <CTAButton
                icon={<Ionicons name="stats-chart" size={20} color="black" />}
                type="yellow"
                text="View All Stats"
                callbackFn={handleViewStats}
              />
              <CTAButton
                icon={<Ionicons name="git-compare-outline" size={24} color="white" />}
                type="brand"
                callbackFn={() => {
                  context === 'teams'
                    ? router.push({
                        pathname: `/teams/${profile.id}/compare-stats`,
                        params: { defaultEntity: JSON.stringify(profile), entityType: 'team' },
                      })
                    : context === 'home/upcoming-fixture'
                      ? router.push({
                          pathname: `/home/upcoming-fixture/${profile.id}/compare-stats`,
                          params: { defaultEntity: JSON.stringify(profile), entityType: 'team' },
                        })
                      : context === 'home/league/team'
                        ? router.push({
                            pathname: `/home/league/${profile.id}/compare-stats`,
                            params: { defaultEntity: JSON.stringify(profile), entityType: 'team' },
                          })
                        : null;
                }}
                text="Compare Stats"
              />
            </View>
          </View>
          <View className={`gap-4 bg-bg-grouped-2 px-4 ${viewMatches ? 'pb-6' : 'pb-4'} pt-4`}>
            <Pressable
              className="flex-row items-center justify-between pr-6"
              onPress={() => safeMatches.length > 0 && setViewMatches(!viewMatches)}>
              <Heading text="Recent Results" />

              {safeMatches.length > 0 && (
                <View className="">
                  <Animated.View style={{ transform: [{ rotate }] }}>
                    <Ionicons className="" name="chevron-down" size={30} />
                  </Animated.View>
                </View>
              )}
            </Pressable>
            {viewMatches && <Last5MatchesList matches={last5Results?.details || []} />}
          </View>
          <View className="gap-3 bg-bg-grouped-2 px-4 py-6">
            <Heading text="Team Awards" />
            <TrophyCabinet trophies={trophies || []} />
          </View>

          <View className="bg-bg-grouped-2 px-4 pb-8 pt-6">
            <View className="flex flex-row items-center justify-between pb-3 pr-2">
              <Heading text="Team Roster" />
              <Text className="mb-2 font-saira text-xl text-text-2">
                {`${players?.length || 0} Player${players?.length === 1 ? '' : 's'}`}
              </Text>
            </View>
            <PlayersList
              team={profile}
              context={context}
              players={players}
              isLoading={isLoadingPlayers}
              error={playersError}
            />
          </View>
          <TeamJoinRequests teamId={profile?.id} />
          <View className="flex gap-5 bg-bg-grouped-2 px-4 pb-8 pt-6">
            {player.id === profile.captain && (
              <CTAButton
                type="error"
                text="Disband Team"
                icon={<Ionicons name="trash-outline" size={20} color="white" />}
                callbackFn={() => router.push(`/teams/${profile.id}/full-profile`)}
              />
            )}
            <Text className="pt-2 text-center font-saira text-xs text-text-2">{`Team ID: ${profile.id}`}</Text>
          </View>
        </View>
      </ScrollView>
      <BottomSheetModal
        showModal={statModalVisible}
        setShowModal={setStatModalVisible}
        title={`Editing Slot ${editingSlotIndex !== null ? editingSlotIndex + 1 : ''}`}>
        <SelectStatMenu
          context="team"
          statOptions={statOptions}
          statSlots={statSlots}
          editingSlotIndex={editingSlotIndex}
          setStatSlots={setStatSlots}
          setStatModalVisible={setStatModalVisible}
          profile={profile}
        />
      </BottomSheetModal>
    </>
  );
};

export default TeamProfile;

const styles = StyleSheet.create({});
