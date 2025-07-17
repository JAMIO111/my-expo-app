import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ioconicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import TeamLogo from './TeamLogo';
import { useColorScheme } from 'nativewind';
import colors from '@lib/colors';
import { useUser } from '@contexts/UserProvider';

const LeagueHomeCard = ({ standings }) => {
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme];
  const router = useRouter();
  const { player } = useUser();
  console.log(standings, 'Standings Data:');

  const myTeam = standings?.standings?.find((team) => team.team === player?.team?.id);
  return (
    <Pressable
      onPress={() => router.push('/home/league')}
      className="h-28 w-full rounded-xl bg-bg-grouped-2">
      <View className="mx-3 flex-row items-center justify-between border-b border-separator px-1 pb-1 pt-2">
        <Text className="font-saira-medium text-2xl text-text-1">League Table</Text>
        <Ioconicons name="chevron-forward" size={20} color={themeColors.icon} />
      </View>
      {standings === undefined || standings.standings.length === 0 ? (
        <View className="items-left flex-1 justify-center px-4">
          <Text className="text-left text-lg text-text-2">No standings available yet.</Text>
        </View>
      ) : (
        <View className="flex-1 flex-row items-center justify-between px-4 py-3">
          <View className="flex-1 flex-row items-center justify-start gap-3">
            <Text className="font-saira text-2xl font-semibold text-text-1">
              {myTeam?.position}.
            </Text>
            <TeamLogo
              size={20}
              type={myTeam?.Teams?.crest?.type}
              color1={myTeam?.Teams?.crest?.color1}
              color2={myTeam?.Teams?.crest?.color2}
              thickness={myTeam?.Teams?.crest?.thickness}
            />
            <Text className="font-saira text-xl text-text-2">{player?.team?.display_name}</Text>
          </View>
          <Text className="font-saira text-2xl font-semibold text-text-1">{`${myTeam?.points} Pts`}</Text>
        </View>
      )}
    </Pressable>
  );
};

export default LeagueHomeCard;

const styles = StyleSheet.create({});
