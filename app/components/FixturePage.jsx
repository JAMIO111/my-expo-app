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
              <View className=" flex-row items-center justify-between gap-2 border-b border-theme-gray-4 bg-bg-1 px-4 py-2">
                <Text className="text-left font-saira-medium text-lg text-text-1">
                  {`${fixtureDetails?.competition?.name} - ${stage.stage_type.charAt(0).toUpperCase() + stage.stage_type.slice(1)}`}
                </Text>
                <Text className="text-right font-saira-medium text-lg text-text-1">
                  {stage?.name}
                </Text>
              </View>
              <View className="p-5">
                {!isPast ? (
                  <View className="mb-3 flex-row items-center justify-around">
                    <View>
                      <Text className="text-center font-saira text-2xl font-bold text-text-1">
                        {days}
                      </Text>
                      <Text className="text-center font-saira text-lg text-text-2">Days</Text>
                    </View>
                    <View>
                      <Text className="text-center font-saira text-2xl font-bold text-text-1">
                        {hours}
                      </Text>
                      <Text className="text-center font-saira text-lg text-text-2">Hrs</Text>
                    </View>
                    <View>
                      <Text className="text-center font-saira text-2xl font-bold text-text-1">
                        {minutes}
                      </Text>
                      <Text className="text-center font-saira text-lg text-text-2">Mins</Text>
                    </View>
                    <View>
                      <Text className="text-center font-saira text-2xl font-bold text-text-1">
                        {seconds}
                      </Text>
                      <Text className="text-center font-saira text-lg text-text-2">Secs</Text>
                    </View>
                  </View>
                ) : fixtureDetails?.approved ? (
                  <View className="flex-row items-center justify-around px-2">
                    <Text
                      style={{ lineHeight: 32 }}
                      className="items-center justify-center gap-2 rounded-xl bg-theme-gray-5 px-3 py-1 text-center font-saira-medium text-lg text-text-1 shadow-sm">
                      Final Score
                    </Text>
                  </View>
                ) : fixtureDetails?.is_complete ? (
                  <View className="flex-row items-center justify-around px-2">
                    <Text
                      style={{ lineHeight: 32 }}
                      className="items-center justify-center gap-2 rounded-xl bg-theme-gray-5 px-4 py-1 text-center font-saira-medium text-lg text-text-1 shadow-sm">
                      Pending Confirmation
                    </Text>
                  </View>
                ) : isOverdue ? (
                  <View className="flex-row items-center justify-around px-2">
                    <Text
                      style={{ lineHeight: 32 }}
                      className="items-center justify-center gap-2 rounded-xl border border-theme-red px-3 py-0.5 text-center font-saira-medium text-lg text-theme-red shadow-sm">
                      Awaiting Results
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-around">
                    <LivePulseCard fontSize={20} dotSize={12} />
                  </View>
                )}

                <View className="relative mb-2 flex-row items-start justify-center p-3">
                  <Pressable
                    onPress={() => handleTeamPress(fixtureDetails?.homeCompetitor?.id)}
                    className="absolute left-0 z-50">
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
                  <Pressable
                    onPress={() => handleTeamPress(fixtureDetails?.homeCompetitor?.id)}
                    style={{
                      backgroundColor: fixtureDetails?.homeCompetitor?.crest?.color1 || 'white',
                    }}
                    className="ml-10 flex flex-1 flex-row items-center justify-center py-0.5">
                    <Text
                      numberOfLines={1}
                      style={{ color: homeTextColor }}
                      className={`flex-1 py-1 pl-4 pr-2 ${competitorType === 'team' ? 'mt-1 text-center font-saira-semibold text-2xl' : 'text-right font-saira-medium text-lg'}`}>
                      {competitorType === 'team'
                        ? fixtureDetails?.homeCompetitor?.abbreviation
                        : `${fixtureDetails?.homeCompetitor?.nickname.toUpperCase()}`}
                    </Text>
                  </Pressable>
                  <Text className="rounded-b-2xl border-x-2 border-bg-2 bg-bg-3 p-3 font-saira-medium text-3xl text-text-1">
                    {isPast
                      ? `${fixtureDetails?.frames.filter((frame) => frame.winner_side === 'home').length || 0} - ${fixtureDetails?.frames.filter((frame) => frame.winner_side === 'away').length || 0}`
                      : fixtureDetails?.date_time
                        ? new Date(fixtureDetails?.date_time).toLocaleString('en-GB', {
                            timeZone: 'Europe/London',

                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false, // 24-hour format
                          })
                        : '0 : 0'}
                  </Text>
                  <Pressable
                    onPress={() => handleTeamPress(fixtureDetails?.awayCompetitor?.id)}
                    className="absolute right-0 z-50">
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
                  <Pressable
                    onPress={() => handleTeamPress(fixtureDetails?.awayCompetitor?.id)}
                    style={{
                      backgroundColor: fixtureDetails?.awayCompetitor?.crest?.color1 || 'white',
                    }}
                    className="mr-10 flex flex-1 flex-row items-center justify-center py-0.5">
                    <Text
                      numberOfLines={1}
                      style={{ color: awayTextColor }}
                      className={`flex-1 py-1 pl-2 pr-4 ${competitorType === 'team' ? 'mt-1 text-center font-saira-semibold text-2xl' : 'text-left font-saira-medium text-lg'}`}>
                      {competitorType === 'team'
                        ? fixtureDetails?.awayCompetitor?.abbreviation
                        : `${fixtureDetails?.awayCompetitor?.nickname.toUpperCase()}`}
                    </Text>
                  </Pressable>
                </View>
                <View className="flex-row items-center justify-center gap-2 pb-2">
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    className="flex-1 text-right font-saira-semibold text-lg text-text-1">
                    {fixtureDetails?.homeCompetitor?.display_name}
                  </Text>
                  <Text className="w-6 text-text-2"> vs </Text>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    className="flex-1 text-left font-saira-semibold text-lg text-text-1">
                    {fixtureDetails?.awayCompetitor?.display_name}
                  </Text>
                </View>
                <View className="border-t border-theme-gray-4 py-2"></View>
                <View>
                  <Text className="mb-2 text-center font-saira-medium text-xl text-text-2">
                    {fixtureDetails.date_time
                      ? new Date(fixtureDetails?.date_time).toLocaleString('en-GB', {
                          timeZone: 'Europe/London',

                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'No Date Set'}
                  </Text>
                  <Pressable
                    onPress={address ? openNativeMaps : null}
                    className="items-center justify-center">
                    <Text className="px-4 text-center font-saira text-lg text-text-2 underline">
                      {address || 'No address available'}
                    </Text>
                  </Pressable>
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
