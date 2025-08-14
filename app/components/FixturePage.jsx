import { StyleSheet, ScrollView, Text, View, Pressable, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';
import TeamLogo from '@components/TeamLogo';
import useKickoffCountdown from '@hooks/Countdown';
import SlidingTabButton from '@components/SlidingTabButton';
import StatCardCompare from '@components/StatCardCompare';
import { useRouter } from 'expo-router';
import PlayersList from '@components/PlayersList';
import colors from '@lib/colors';
import { getContrastColor } from '@lib/helperFunctions';
import FormWidget from '@components/FormWidget';
import { FixtureDetailsSkeleton } from '@components/Skeletons';
import FramesList from '@components/FramesList';
import HeadToHead from './HeadToHead';

const FixturePage = ({ fixtureDetails, isLoading, context }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const { fixtureId } = useLocalSearchParams();
  const { days, hours, minutes, seconds, isPast } = useKickoffCountdown(fixtureDetails?.date_time);
  const [view, setView] = useState('left');
  const [team, setTeam] = useState('left');
  const hasNavigated = useRef(false);

  const handleTeamPress = (teamId) => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    setTimeout(() => {
      hasNavigated.current = false;
    }, 750); // Reset navigation state after 750ms
    if (context === 'home/upcoming-fixture') {
      router.push(`/home/${fixtureId}/${teamId}`);
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

  const isLive = new Date() >= new Date(fixtureDetails?.date_time);

  return (
    <ScrollView className="mt-16 flex-1 bg-brand">
      {isLoading ? (
        <FixtureDetailsSkeleton fixtureDetails={fixtureDetails} />
      ) : (
        <View className="bg-bg-grouped-1">
          <View
            style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
            className="bg-brand p-3 pb-4">
            <View className="rounded-3xl bg-bg-2 p-5">
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
              ) : fixtureDetails?.is_complete ? (
                <View className="flex-row items-center justify-around px-2">
                  <Text
                    style={{ lineHeight: 32 }}
                    className="items-center justify-center gap-2 rounded-xl bg-theme-gray-5 px-4 py-1 text-center font-saira-medium text-2xl text-text-1">
                    Final Score
                  </Text>
                </View>
              ) : (
                <View className="items-center justify-around">
                  <View className="mb-1 flex-row items-center justify-center gap-2 rounded-lg bg-theme-gray-5 px-4 py-0.5">
                    <View className="h-4 w-4 rounded-full bg-theme-red"></View>
                    <Text
                      style={{ lineHeight: 32 }}
                      className="font-saira-medium text-2xl text-text-1">
                      Live
                    </Text>
                  </View>
                </View>
              )}
              <View className="relative mb-2 flex-row items-start justify-center p-3">
                <Pressable
                  onPress={() => handleTeamPress(fixtureDetails?.homeTeam?.id)}
                  className="absolute left-0 z-50">
                  <View className="rounded-full">
                    <TeamLogo
                      size={60}
                      color1={fixtureDetails?.homeTeam?.crest?.color1}
                      color2={fixtureDetails?.homeTeam?.crest?.color2}
                      type={fixtureDetails?.homeTeam?.crest?.type}
                      thickness={fixtureDetails?.homeTeam?.crest?.thickness}
                    />
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleTeamPress(fixtureDetails?.homeTeam?.id)}
                  style={{ backgroundColor: fixtureDetails?.homeTeam?.crest?.color1 }}
                  className="ml-10 flex-1 items-center justify-center py-0.5">
                  <Text
                    style={{ color: homeTextColor }}
                    className="mt-1 font-saira-semibold text-2xl">
                    {fixtureDetails?.homeTeam?.abbreviation}
                  </Text>
                </Pressable>
                <Text className="rounded-b-2xl border-x-2 border-bg-2 bg-bg-3 p-3 font-saira-medium text-3xl text-text-1">
                  {isPast
                    ? `${fixtureDetails?.home_score} - ${fixtureDetails?.away_score}`
                    : new Date(fixtureDetails?.date_time).toLocaleString('en-GB', {
                        timeZone: 'Europe/London',

                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false, // 24-hour format
                      })}
                </Text>
                <Pressable
                  onPress={() => handleTeamPress(fixtureDetails?.awayTeam?.id)}
                  className="absolute right-0 z-50">
                  <View className="rounded-full">
                    <TeamLogo
                      size={60}
                      color1={fixtureDetails?.awayTeam?.crest?.color1}
                      color2={fixtureDetails?.awayTeam?.crest?.color2}
                      type={fixtureDetails?.awayTeam?.crest?.type}
                      thickness={fixtureDetails?.awayTeam?.crest?.thickness}
                    />
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleTeamPress(fixtureDetails?.awayTeam?.id)}
                  style={{ backgroundColor: fixtureDetails?.awayTeam?.crest?.color1 }}
                  className="mr-10 flex-1 items-center justify-center py-0.5">
                  <Text
                    style={{ color: awayTextColor }}
                    className="mt-1 font-saira-semibold text-2xl">
                    {fixtureDetails?.awayTeam?.abbreviation}
                  </Text>
                </Pressable>
              </View>
              <View className="flex-row items-center justify-center gap-2 pb-2">
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="flex-1 text-right font-saira-semibold text-xl text-text-1">
                  {fixtureDetails?.homeTeam?.display_name}
                </Text>
                <Text className="w-6 text-text-2"> vs </Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="flex-1 text-left font-saira-semibold text-xl text-text-1">
                  {fixtureDetails?.awayTeam?.display_name}
                </Text>
              </View>
              <View className="border-t border-theme-gray-4 py-2"></View>
              <View>
                <Text className="mb-2 text-center font-saira-medium text-xl text-text-2">
                  {new Date(fixtureDetails?.date_time).toLocaleString('en-GB', {
                    timeZone: 'Europe/London',

                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text className="text-center font-saira text-lg text-text-2">
                  {' '}
                  {fixtureDetails?.homeTeam?.address?.line_1},{' '}
                  {fixtureDetails?.homeTeam?.address?.line_2},{' '}
                </Text>
                <Text className="text-center font-saira text-lg text-text-2">
                  {' '}
                  {fixtureDetails?.homeTeam?.address?.city},{' '}
                  {fixtureDetails?.homeTeam?.address?.postcode}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
      <View className="bg-bg-grouped-1 pb-16">
        <View className="p-3">
          <SlidingTabButton
            option1="Stats"
            option2={fixtureDetails?.approved ? 'Frames' : 'Squads'}
            onChange={handleViewChange}
          />
        </View>
        {view === 'right' ? (
          fixtureDetails?.approved ? (
            <View className="p-3">
              <FramesList fixtureId={fixtureId} />
            </View>
          ) : (
            <View>
              <SlidingTabButton
                option1={fixtureDetails?.homeTeam?.display_name}
                option2={fixtureDetails?.awayTeam?.display_name}
                onChange={setTeam}
              />
              <View className="h-full p-3">
                <PlayersList
                  team={team === 'left' ? fixtureDetails?.homeTeam : fixtureDetails?.awayTeam}
                  context={context}
                  fixtureId={fixtureId}
                />
              </View>
            </View>
          )
        ) : (
          <View className="mt-5 h-full">
            <View className="border-b-[0.5px] border-theme-gray-5">
              <FormWidget
                teamId={fixtureDetails?.homeTeam?.id}
                awayTeamId={fixtureDetails?.awayTeam?.id}
              />
            </View>
            <Text className="px-3 py-3 pb-1 font-saira-medium text-xl text-text-1">
              Current Season
            </Text>
            <StatCardCompare
              fixture={fixtureDetails}
              stat={{
                statName: 'Games Played',
                homeValue: 12,
                awayValue: 8,
              }}
            />
            <StatCardCompare
              fixture={fixtureDetails}
              stat={{
                statName: 'Games Won',
                homeValue: 11,
                awayValue: 5,
              }}
            />
            <StatCardCompare
              fixture={fixtureDetails}
              stat={{
                statName: 'Game Win %',
                homeValue: 61,
                awayValue: 32,
              }}
            />
            <StatCardCompare
              fixture={fixtureDetails}
              stat={{
                statName: 'Frames Played',
                homeValue: 61,
                awayValue: 32,
              }}
            />
            <StatCardCompare
              fixture={fixtureDetails}
              stat={{
                statName: 'Frames Won',
                homeValue: 61,
                awayValue: 32,
              }}
            />
            <StatCardCompare
              fixture={fixtureDetails}
              stat={{
                statName: 'Frame Win %',
                homeValue: 52,
                awayValue: 32,
              }}
            />
            <Text className="px-3 py-3 pb-1 font-saira-medium text-xl text-text-1">
              Head to Head - All Time
            </Text>
            <HeadToHead homeTeam={fixtureDetails?.homeTeam} awayTeam={fixtureDetails?.awayTeam} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default FixturePage;

const styles = StyleSheet.create({});
