import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

const PlayerCard = ({ player, team }) => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  // Get initials fallback from first name and surname
  const getInitials = () => {
    const firstInitial = player?.first_name?.[0] || '';
    const lastInitial = player?.surname?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };
  console.log('Player', player);
  const IconColor = colorScheme === 'dark' ? '#fff' : '#000';
  return (
    <Pressable onPress={() => router.push(`/teams/${player.id}`)} className="w-full">
      <View className="bg-background shadow-border-color w-full flex-row items-center justify-between gap-4 rounded-xl py-3 pl-3 pr-2">
        {player.avatar_url ? (
          <Image
            source={{ uri: player.avatar_url }}
            className="border-border-color mr-2 h-16 w-16 rounded-md border"
            resizeMode="cover"
          />
        ) : (
          <View
            className="bg-brand-light mr-2 h-16 w-16 rounded-md"
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
          <Text className="text-text-primary text-2xl font-bold">
            {player?.first_name} {player?.surname}
          </Text>
          <View className="flex-row items-center">
            {player.nickname && (
              <Text className="text-text-secondary text-xl font-semibold">{player?.nickname}</Text>
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
        <Ionicons name="chevron-forward-outline" size={24} color={IconColor} />
      </View>
    </Pressable>
  );
};

export default PlayerCard;

const styles = StyleSheet.create({});
