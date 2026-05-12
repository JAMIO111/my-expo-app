import {
  StyleSheet,
  ScrollView,
  Text,
  View,
  Pressable,
  useColorScheme,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';
import TeamLogo from '@components/TeamLogo';
import useKickoffCountdown from '@hooks/Countdown';
import SlidingTabButton from '@components/SlidingTabButton';
import { useRouter } from 'expo-router';
import PlayersList from '@components/PlayersList';
import colors from '@lib/colors';
import { getContrastColor } from '@lib/helperFunctions';
import FormWidget from '@components/FormWidget';
import { FixtureDetailsSkeleton } from '@components/Skeletons';
import FramesList from '@components/FramesList';
import HeadToHead from '@components/HeadToHead';
import SeasonStats from '@components/SeasonStats';
import LivePulseCard from '@components/LivePulseCard';
import { useTeamPlayers } from '@hooks/useTeamPlayers';
import Avatar from '@components/Avatar';
import LoadingScreen from '@components/LoadingScreen';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import SevenSegmentScoreboard from './SevenSegmentScoreboard';
import Ionicons from '@expo/vector-icons/Ionicons';

const FixturePage = ({ fixtureDetails, isLoading, context }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const { fixtureId } = useLocalSearchParams();
  const { days, hours, minutes, seconds, isPast, isOverdue } = useKickoffCountdown(
    fixtureDetails?.date_time
  );
  const { data: frames, isLoading: isLoadingFrames } = useResultsByFixture(fixtureId);
  const [view, setView] = useState('left');
  const [team, setTeam] = useState('left');
  const [formType, setFormType] = useState('matches');
  const hasNavigated = useRef(false);

  const {
    data: players,
    isLoading: isLoadingPlayers,
    error: playersError,
  } = useTeamPlayers(team === 'left' ? fixtureDetails?.homeTeam?.id : fixtureDetails?.awayTeam?.id);

  console.log('FixturePage fixtureDetails:', fixtureDetails);

  const competitorType = fixtureDetails?.homeCompetitor?.type;

  const stage = fixtureDetails?.competition?.stage?.find((s) => s.id === fixtureDetails?.stage_id);

  const address = [
    fixtureDetails?.homeTeam?.address?.line_1,
    fixtureDetails?.homeTeam?.address?.line_2,
    fixtureDetails?.homeTeam?.address?.city,
    fixtureDetails?.homeTeam?.address?.county,
    fixtureDetails?.homeTeam?.address?.postcode,
  ]
    .filter(Boolean)
    .join(', ');

  const iosMapsUrl = `maps://?address=${address}`;

  const androidMapsUrl = `geo:0,0?q=${address}`;

  const openNativeMaps = () => {
    const url = Platform.OS === 'ios' ? iosMapsUrl : androidMapsUrl;

    Linking.openURL(url);
  };

  const handleTeamPress = (competitorId) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    setTimeout(() => {
      hasNavigated.current = false;
    }, 750); // Reset navigation state after 750ms
    if (context === 'home/upcoming-fixture') {
      router.push(`/home/${fixtureId}/${competitorId}`);
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === 'right') {
      setTeam('left'); // reset to home team when switching to Squads view
    }
  };

  const homeTextColor = getContrastColor(
    fixtureDetails?.homeTeam?.crest?.color1 || themeColors.bg1
  );
  const awayTextColor = getContrastColor(
    fixtureDetails?.awayTeam?.crest?.color1 || themeColors.bg1
  );

  const homeScore = frames?.filter((frame) => frame.winner_side === 'home').length || 0;
  const awayScore = frames?.filter((frame) => frame.winner_side === 'away').length || 0;

  const approved = fixtureDetails?.approved;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView className="mt-16 flex-1 bg-brand">
      {isLoading ? (
        <FixtureDetailsSkeleton fixtureDetails={fixtureDetails} />
      ) : (
        <View className="bg-bg-grouped-1">
          <View
            style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
            className="bg-brand p-3 pb-4">
            <View className="overflow-hidden rounded-3xl bg-bg-2">
              <View className=" flex-row items-center justify-between gap-2 bg-bg-1 px-4 py-2">
                <Text className="text-left font-saira-medium text-text-1">
                  {`${fixtureDetails?.competition?.season?.name} ${fixtureDetails?.competition?.name}${
                    fixtureDetails?.competition?.competition_type?.competition_type !== 'league'
                      ? ` - ${stage.stage_type?.charAt(0)?.toUpperCase() + stage.stage_type?.slice(1)}`
                      : ''
                  }`}
                </Text>
                <Text className="text-right font-saira-medium text-text-1">
                  {stage?.name} Match
                </Text>
              </View>
              <View className="pb-4">
                <View className="gap-3">
                  <View className="flex-row  items-center justify-between border-y border-theme-gray-4">
                    <Pressable
                      onPress={() => handleTeamPress(fixtureDetails?.homeCompetitor?.id)}
                      style={{
                        backgroundColor: fixtureDetails?.homeCompetitor?.crest?.color1 || '#FFD700',
                      }}
                      className="flex flex-1 flex-row items-center justify-center py-0.5">
                      <Text
                        numberOfLines={1}
                        style={{ color: homeTextColor }}
                        className={`mt-1 flex-1 py-1 pl-2 pr-4 text-center font-saira-medium text-2xl`}>
                        {competitorType === 'team'
                          ? fixtureDetails?.homeCompetitor?.abbreviation
                          : `${fixtureDetails?.homeCompetitor?.nickname?.toUpperCase() || fixtureDetails?.homeCompetitor?.surname?.toUpperCase()}`}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleTeamPress(fixtureDetails?.awayCompetitor?.id)}
                      style={{
                        backgroundColor: fixtureDetails?.awayCompetitor?.crest?.color1 || '#FF2211',
                      }}
                      className="flex flex-1 flex-row items-center justify-center py-0.5">
                      <Text
                        numberOfLines={1}
                        style={{ color: competitorType === 'team' ? awayTextColor : '#fff' }}
                        className={`mt-1 flex-1 py-1 pl-2 pr-4 text-center font-saira-medium text-2xl`}>
                        {competitorType === 'team'
                          ? fixtureDetails?.awayCompetitor?.abbreviation
                          : `${fixtureDetails?.awayCompetitor?.nickname?.toUpperCase() || fixtureDetails?.awayCompetitor?.surname?.toUpperCase()}`}
                      </Text>
                    </Pressable>
                  </View>
                  <View className="w-full flex-row items-center justify-evenly">
                    <Pressable onPress={() => handleTeamPress(fixtureDetails?.homeCompetitor?.id)}>
                      <View className="rounded-full">
                        {competitorType === 'team' ? (
                          <TeamLogo
                            size={60}
                            color1={fixtureDetails?.homeCompetitor?.crest?.color1}
                            color2={fixtureDetails?.homeCompetitor?.crest?.color2}
                            type={fixtureDetails?.homeCompetitor?.crest?.type}
                            thickness={fixtureDetails?.homeCompetitor?.crest?.thickness}
                          />
                        ) : (
                          <Avatar player={fixtureDetails?.homePlayer} size={60} borderRadius={12} />
                        )}
                      </View>
                    </Pressable>
                    <View className="items-center justify-center">
                      <SevenSegmentScoreboard
                        homeScore={homeScore}
                        awayScore={awayScore}
                        scale={0.45}
                      />
                    </View>
                    <Pressable onPress={() => handleTeamPress(fixtureDetails?.awayCompetitor?.id)}>
                      <View className="rounded-full">
                        {competitorType === 'team' ? (
                          <TeamLogo
                            size={60}
                            color1={fixtureDetails?.awayCompetitor?.crest?.color1}
                            color2={fixtureDetails?.awayCompetitor?.crest?.color2}
                            type={fixtureDetails?.awayCompetitor?.crest?.type}
                            thickness={fixtureDetails?.awayCompetitor?.crest?.thickness}
                          />
                        ) : (
                          <Avatar player={fixtureDetails?.awayPlayer} size={60} borderRadius={12} />
                        )}
                      </View>
                    </Pressable>
                  </View>
                  <View className="flex-row items-center justify-between gap-3 px-2 pb-2">
                    <Text
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      className="flex-1 text-right font-saira-medium text-lg text-text-1">
                      {fixtureDetails?.homeCompetitor?.display_name}
                    </Text>
                    <Text className="w-6 text-text-2"> vs </Text>
                    <Text
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      className="flex-1 text-left font-saira-medium text-lg
                       text-text-1">
                      {fixtureDetails?.awayCompetitor?.display_name}
                    </Text>
                  </View>
                </View>

                <View className="mt-2 gap-5 border-t border-theme-gray-4 px-4 pt-4">
                  {/* Address row */}
                  <Pressable
                    onPress={address ? openNativeMaps : null}
                    className="flex-row items-center gap-3">
                    <View className="items-center justify-center rounded-xl bg-bg-1 p-2 shadow-sm">
                      <Ionicons
                        name={address ? 'location-outline' : 'location-outline'}
                        size={24}
                        color="#888"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-saira text-sm text-text-2">Venue</Text>
                      <Text
                        numberOfLines={2}
                        className={`font-saira-medium text-base ${address ? 'text-text-1' : 'text-text-2'}`}>
                        {address || 'No address available'}
                      </Text>
                    </View>
                    {address && <Ionicons name="chevron-forward-outline" size={20} color="#888" />}
                  </Pressable>

                  {/* Date row */}
                  <View className="flex-row items-center gap-3">
                    <View className="items-center justify-center rounded-xl bg-bg-1 p-2 shadow-sm">
                      <Ionicons name="calendar-outline" size={24} color="#888" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-saira text-sm text-text-2">
                        {fixtureDetails.date_time
                          ? new Date(fixtureDetails.date_time).toLocaleDateString('en-GB', {
                              timeZone: 'Europe/London',
                              weekday: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : 'Date TBC'}
                      </Text>
                      <Text className="font-saira-medium text-base text-text-1">
                        {fixtureDetails.date_time
                          ? new Date(fixtureDetails.date_time).toLocaleDateString('en-GB', {
                              timeZone: 'Europe/London',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'No date available'}
                      </Text>
                    </View>
                    {approved ? (
                      <View className="flex-row items-center justify-center gap-2 rounded-xl bg-bg-3 px-2 py-1 shadow-sm">
                        <Ionicons name="checkmark-circle-outline" size={20} color="#888" />
                        <Text style={{ fontSize: 16 }} className="font-saira-medium text-text-1">
                          Final Score
                        </Text>
                      </View>
                    ) : fixtureDetails?.date_time && !isPast ? (
                      <View className="flex-row items-center justify-center gap-2 rounded-xl bg-bg-3 px-2 py-1 shadow-sm">
                        <Ionicons name="time-outline" size={20} color="#888" />
                        <Text style={{ fontSize: 16 }} className="font-saira-medium text-text-1">
                          {`${days}d ${hours}h ${minutes}m ${seconds}s`}
                        </Text>
                      </View>
                    ) : fixtureDetails?.date_time ? (
                      <LivePulseCard fontSize={18} dotSize={10} />
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
      <View className="bg-bg-grouped-1 pb-16">
        <View className="p-3">
          <SlidingTabButton
            option1="Stats"
            option2={frames && frames.length > 0 ? 'Frames' : 'Squads'}
            onChange={handleViewChange}
            value={view}
          />
        </View>
        {view === 'right' ? (
          frames && frames.length > 0 ? (
            <View className="p-3">
              <FramesList fixtureId={fixtureId} />
            </View>
          ) : (
            <View>
              <View className="flex h-full gap-3 bg-bg-1 p-3">
                <SlidingTabButton
                  option1={fixtureDetails?.homeCompetitor?.display_name}
                  option2={fixtureDetails?.awayCompetitor?.display_name}
                  onChange={setTeam}
                  value={team}
                />
                <PlayersList
                  team={
                    team === 'left'
                      ? fixtureDetails?.homeCompetitor
                      : fixtureDetails?.awayCompetitor
                  }
                  context={context}
                  fixtureId={fixtureId}
                  players={players}
                  isLoading={isLoadingPlayers}
                  error={playersError}
                />
              </View>
            </View>
          )
        ) : (
          <View className="h-full gap-3 p-3">
            <View>
              <FormWidget
                homeCompetitorId={fixtureDetails?.homeCompetitor?.id}
                awayCompetitorId={fixtureDetails?.awayCompetitor?.id}
                competitorType={competitorType}
                formType={formType}
                onFormTypeChange={setFormType}
              />
            </View>
            <Text className="mt-2 font-saira-medium text-2xl text-text-1">Current Season</Text>
            <SeasonStats
              fixtureDetails={fixtureDetails}
              homeTeam={fixtureDetails?.homeCompetitor}
              awayTeam={fixtureDetails?.awayCompetitor}
            />
            <Text className="mt-2 pl-2 font-saira-medium text-2xl text-text-1">
              Head to Head - All Time
            </Text>
            <HeadToHead
              homeTeam={fixtureDetails?.homeCompetitor}
              awayTeam={fixtureDetails?.awayCompetitor}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default FixturePage;

const styles = StyleSheet.create({});
