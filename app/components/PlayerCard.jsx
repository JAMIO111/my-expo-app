import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useLocalSearchParams, usePathname } from 'expo-router';

const PlayerCard = ({ player, team, context }) => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { teamId, fixtureId } = useLocalSearchParams();

  // Get initials fallback from first name and surname
  const getInitials = () => {
    const firstInitial = player?.first_name?.[0] || '';
    const lastInitial = player?.surname?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };
  const IconColor = colorScheme === 'dark' ? '#fff' : '#000';
  console.log('PlayerCard:', context);
  console.log('TeamID:', teamId);
  const pathname = usePathname();
  const params = useLocalSearchParams();
  console.log('Current Path:', pathname);
  console.log('Current Params:', params);
  const handlePress = () => {
    if (context === 'teams') {
      router.push(`/teams/${player.id}`);
    } else if (context === 'fixture' && fixtureId) {
      router.push(`/home/${fixtureId}/fixture/${player.id}`);
    } else if (context === 'home/league' && teamId) {
      router.push(`/home/league/${teamId}/${player.id}`);
    }
  };

  return (
    <Pressable onPress={handlePress} className="w-full">
      <View className="w-full flex-row items-center justify-between gap-4 rounded-xl bg-bg-grouped-2 py-3 pl-3 pr-2 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
        {player?.avatar_url ? (
          <Image
            source={{ uri: player?.avatar_url }}
            className="mr-2 h-16 w-16 rounded-md border border-separator"
            resizeMode="cover"
          />
        ) : (
          <View
            className="mr-2 h-16 w-16 rounded-md bg-brand-light"
            style={{
              width: 60,
              height: 60,
              borderRadius: 5,
              marginRight: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text className="text-3xl font-bold text-white">{getInitials()}</Text>
          </View>
        )}
        <View className="flex-1 justify-center">
          <Text className="text-2xl font-bold text-text-1">
            {player?.first_name} {player?.surname}
          </Text>
          <View className="flex-row items-center">
            {player.nickname && (
              <Text className="text-xl font-semibold text-text-2">{player?.nickname}</Text>
            )}
          </View>
        </View>
        {team?.captain === player?.id && (
          <View className="h-12 justify-center rounded border bg-yellow-500">
            <View className="w-full items-center justify-center bg-white px-1">
              <Text>Captain</Text>
            </View>
          </View>
        )}
        {team?.vice_captain === player?.id && (
          <View className="h-12 justify-center rounded border bg-brand-light">
            <View className="w-full items-center justify-center bg-white px-4">
              <Text>VC</Text>
            </View>
          </View>
        )}
        <Ionicons name="chevron-forward-outline" size={24} color={IconColor} />
      </View>
    </Pressable>
  );
};

export default PlayerCard;

const styles = StyleSheet.create({});
