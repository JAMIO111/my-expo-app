import { Pressable, StyleSheet, Text, View } from 'react-native';
import TeamLogo from './TeamLogo';
import { useRouter } from 'expo-router';
import { useRef } from 'react';

const UpcomingFixtureCard = ({ fixture }) => {
  const router = useRouter();
  const hasNavigated = useRef(false);

  return (
    <Pressable
      onPress={() => {
        if (hasNavigated.current) return;
        hasNavigated.current = true;
        setTimeout(() => {
          hasNavigated.current = false;
        }, 750); // Reset navigation state after 750ms
        router.push(`/home/${fixture.id}`);
      }}
      className="h-36 w-72 items-center justify-center gap-2 rounded-xl border border-theme-gray-5 bg-bg-grouped-2 shadow">
      <View className="w-full items-center justify-between px-4">
        <View className="w-full flex-row items-center justify-center gap-2">
          <TeamLogo
            type={fixture?.homeTeam?.crest?.type}
            thickness={fixture?.homeTeam?.crest?.thickness}
            color1={fixture?.homeTeam?.crest?.color1}
            color2={fixture?.homeTeam?.crest?.color2}
            size={20}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="pt-1 font-saira-semibold text-xl text-text-1">
            {fixture?.homeTeam?.display_name || 'Home Team'}
          </Text>
        </View>
        <Text className="font-saira text-text-2">vs</Text>
        <View className="w-full flex-row items-center justify-center gap-2">
          <TeamLogo
            type={fixture?.awayTeam?.crest?.type}
            thickness={fixture?.awayTeam?.crest?.thickness}
            color1={fixture?.awayTeam?.crest?.color1}
            color2={fixture?.awayTeam?.crest?.color2}
            size={20}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="pt-1 font-saira-semibold text-xl text-text-1">
            {fixture?.awayTeam?.display_name || 'Away Team'}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-center gap-2">
        <Text className="font-saira text-text-2">
          {new Date(fixture?.date_time).toLocaleString('en-GB', {
            timeZone: 'Europe/London',
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // optional: set to false for 24h, true for 12h
          })}
        </Text>
        {new Date(fixture.date_time) < new Date() && !fixture?.is_complete && (
          <View className="flex-row items-center gap-1">
            <View className="h-3 w-3 rounded-full bg-theme-red"></View>
            <Text className="font-saira text-theme-red">Live</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default UpcomingFixtureCard;

const styles = StyleSheet.create({});
