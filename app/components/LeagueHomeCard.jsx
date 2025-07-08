import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ioconicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import TeamLogo from './TeamLogo';
import { useColorScheme } from 'nativewind';
import colors from '@lib/colors';

const LeagueHomeCard = () => {
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme];
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/home/league')}
      className="bg-bg-2 h-28 w-full rounded-xl">
      <View className="border-separator mx-3 flex-row items-center justify-between border-b px-1 py-2">
        <Text className="text-text-1 text-2xl font-semibold">League Table</Text>
        <Ioconicons name="chevron-forward" size={24} color={themeColors.icon} />
      </View>
      <View className="flex-1 flex-row items-center justify-between px-4 py-3">
        <View className="flex-1 flex-row items-center justify-start gap-3">
          <Text className="text-text-1 text-2xl font-semibold">12</Text>
          <TeamLogo size={20} />
          <Text className="text-text-2 text-xl">Shankhouse B</Text>
        </View>
        <Text className="text-text-1 text-2xl font-semibold">15 Pts</Text>
      </View>
    </Pressable>
  );
};

export default LeagueHomeCard;

const styles = StyleSheet.create({});
