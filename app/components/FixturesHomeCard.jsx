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
      className="bg-bg-2 h-28 w-full rounded-xl">
      <View className="border-separator mx-3 flex-row items-center justify-between border-b px-1 py-2">
        <Text className="text-text-1 text-2xl font-semibold">Fixtures</Text>
        <Ioconicons name="chevron-forward" size={24} color={themeColors.icon} />
      </View>
      {!fixture ? (
        <View className="items-left flex-1 justify-center px-4">
          <Text className="text-text-2 text-left text-lg">{`No fixtures available yet.`}</Text>
        </View>
      ) : (
        <View className="flex-1 flex-row items-center justify-center px-5">
          <View className="flex-1 flex-row items-center justify-start">
            <Ioconicons name="calendar-outline" size={20} color={themeColors.icon} />
            <Text className="text-text-2 ml-2 text-lg">
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
            <Text className="text-text-1 mr-2 text-lg font-semibold">SHB</Text>
            <TeamLogo
              color1={fixture?.homeTeam?.crest?.color1}
              color2={fixture?.homeTeam?.crest?.color2}
              type={fixture?.homeTeam?.crest?.type}
              thickness={fixture?.homeTeam?.crest?.thickness}
              size={20}
            />
            <Text className="text-text-2 mx-2 text-lg">vs</Text>
            <TeamLogo
              color1={fixture?.awayTeam?.crest?.color1}
              color2={fixture?.awayTeam?.crest?.color2}
              type={fixture?.awayTeam?.crest?.type}
              thickness={fixture?.awayTeam?.crest?.thickness}
              size={20}
            />
            <Text className="text-text-1 ml-2 text-lg font-semibold">SBA</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default FixturesHomeCard;

const styles = StyleSheet.create({});
