import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ioconicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import TeamLogo from './TeamLogo';
import colors from '@lib/colors';
import { useUser } from '@contexts/UserProvider';
import { useColorScheme } from 'react-native';
import { useRef } from 'react';

const LeagueHomeCard = ({ standings }) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const router = useRouter();
  const { currentRole } = useUser();
  const hasNavigated = useRef(false);

  const displayTeam =
    currentRole?.role === 'admin'
      ? standings?.standings?.[0]
      : standings?.standings?.find((team) => team.team === currentRole?.teamId);

  console.log('Display Team:', displayTeam);
  return (
    <Pressable
      onPress={() => {
        if (hasNavigated.current) return;
        hasNavigated.current = true;
        setTimeout(() => {
          hasNavigated.current = false;
        }, 750); // Reset navigation state after 750ms
        router.push('/home/league');
      }}
      className={`h-28 w-full rounded-xl border border-theme-gray-5 bg-bg-grouped-2 shadow`}>
      <View className="mx-3 flex-row items-center justify-between border-b border-theme-gray-5 px-1 pb-1 pt-2">
        <Text className="font-saira-medium text-2xl text-text-1">
          League Table {currentRole?.role === 'admin' && `- ${currentRole?.divisions[0]?.name}`}
        </Text>
        <Ioconicons name="chevron-forward" size={20} color={themeColors?.icon} />
      </View>
      {standings === undefined || standings.standings.length === 0 ? (
        <View className="items-left flex-1 justify-center px-4">
          <Text className="text-left font-saira text-xl text-text-2">
            No standings available yet.
          </Text>
        </View>
      ) : (
        <View className="flex-1 flex-row items-center justify-between px-4 py-3">
          <View className="flex-1 flex-row items-center justify-start gap-3">
            <Text className="font-saira text-2xl font-semibold text-text-1">
              {displayTeam?.position}.
            </Text>
            <TeamLogo
              size={20}
              type={displayTeam?.Teams?.crest?.type}
              color1={displayTeam?.Teams?.crest?.color1}
              color2={displayTeam?.Teams?.crest?.color2}
              thickness={displayTeam?.Teams?.crest?.thickness}
            />
            <Text className="font-saira text-xl text-text-2">
              {displayTeam?.Teams?.display_name}
            </Text>
          </View>
          <Text className="font-saira text-2xl font-semibold text-text-1">{`${displayTeam?.points} Pts`}</Text>
        </View>
      )}
    </Pressable>
  );
};

export default LeagueHomeCard;

const styles = StyleSheet.create({});
