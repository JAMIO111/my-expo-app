import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ioconicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import TeamLogo from './TeamLogo';
import { useColorScheme } from 'nativewind';
import colors from '@lib/colors';

const FixturesHomeCard = ({ fixtures, isLoading }) => {
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme];
  const router = useRouter();
  const fixture = fixtures?.[0];
  return (
    <Pressable
      onPress={() => router.push('/home/fixtures')}
      className="h-28 w-full rounded-xl bg-bg-2">
      <View className="mx-3 flex-row items-center justify-between border-b border-separator px-1 py-2">
        <Text className="text-2xl font-semibold text-text-1">Fixtures</Text>
        <Ioconicons name="chevron-forward" size={24} color={themeColors.icon} />
      </View>
      {!fixture ? (
        <View className="items-left flex-1 justify-center px-4">
          <Text className="text-left text-lg text-text-2">No fixtures available yet.</Text>
        </View>
      ) : (
        <View className="flex-1 flex-row items-center justify-center px-5">
          <View className="flex-1 flex-row items-center justify-start">
            <Ioconicons name="calendar-outline" size={20} color={themeColors.icon} />
            <Text className="ml-2 text-lg text-text-2">
              {new Date(fixture?.date_time).toLocaleString('en-GB', {
                timeZone: 'Europe/London',
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: '2-digit',
              })}
            </Text>
          </View>
          <View className=" flex-row items-center justify-start">
            <Text className="mr-2 text-lg font-semibold text-text-1">
              {fixture?.homeTeam?.abbreviation}
            </Text>
            <TeamLogo
              color1={fixture?.homeTeam?.crest?.color1}
              color2={fixture?.homeTeam?.crest?.color2}
              type={fixture?.homeTeam?.crest?.type}
              thickness={fixture?.homeTeam?.crest?.thickness}
              size={20}
            />
            <Text className="mx-2 text-lg text-text-2">vs</Text>
            <TeamLogo
              color1={fixture?.awayTeam?.crest?.color1}
              color2={fixture?.awayTeam?.crest?.color2}
              type={fixture?.awayTeam?.crest?.type}
              thickness={fixture?.awayTeam?.crest?.thickness}
              size={20}
            />
            <Text className="ml-2 text-lg font-semibold text-text-1">
              {fixture?.awayTeam?.abbreviation}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default FixturesHomeCard;

const styles = StyleSheet.create({});
