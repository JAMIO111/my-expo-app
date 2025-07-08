import { Pressable, StyleSheet, Text, View } from 'react-native';
import TeamLogo from './TeamLogo';
import { useRouter } from 'expo-router';

const UpcomingFixtureCard = ({ fixture }) => {
  const router = useRouter();
  console.log('UpcomingFixtureCard fixture:', fixture);
  return (
    <Pressable
      onPress={() => router.push(`/home/${fixture.id}`)}
      className="h-32 w-72 items-center justify-center gap-2 rounded-xl bg-bg-2">
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
            className="text-xl font-semibold text-text-1">
            {fixture?.homeTeam?.display_name || 'Home Team'}
          </Text>
        </View>
        <Text className="text-text-2">vs</Text>
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
            className="text-xl font-semibold text-text-1">
            {fixture?.awayTeam?.display_name || 'Away Team'}
          </Text>
        </View>
      </View>
      <Text className="text-text-2">
        {new Date(fixture?.date_time).toLocaleString('en-GB', {
          timeZone: 'Europe/London',
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false, // optional: set to false for 24h, true for 12h
        })}
      </Text>
    </Pressable>
  );
};

export default UpcomingFixtureCard;

const styles = StyleSheet.create({});
