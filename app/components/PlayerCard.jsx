import { StyleSheet, Text, View, Image, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { isBirthdayToday } from '@lib/helperFunctions';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';

const PlayerCard = ({ player, team, context }) => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { teamId, fixtureId } = useLocalSearchParams();
  const iconColor = colors[colorScheme]?.icon || '#000';

  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
  };

  // Get initials fallback from first name and surname
  const getInitials = () => {
    const firstInitial = player?.first_name?.[0] || '';
    const lastInitial = player?.surname?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };
  console.log('PlayerCard:', context);
  console.log('TeamID:', teamId);
  const pathname = usePathname();
  const params = useLocalSearchParams();
  console.log('Current Path:', pathname);
  console.log('Current Params:', params);
  const handlePress = () => {
    if (context === 'teams') {
      router.push(`/teams/${player.id}`);
    } else if (context === 'home/upcoming-fixture' && fixtureId) {
      router.push(`/home/${fixtureId}/${teamId}/${player.id}`);
    } else if (context === 'home/league/team' && teamId) {
      router.push(`/home/league/${teamId}/${player.id}`);
    } else if (context === 'home/league') {
      router.push(`/home/league/${player.id}`);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        className="w-full">
        <View className="w-full flex-row items-center justify-between gap-4 rounded-xl border-theme-gray-6 bg-bg-grouped-2 py-3 pl-3 pr-2 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
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
            <Text numberOfLines={1} className="text-2xl font-bold text-text-1">
              {player?.first_name} {player?.surname}
            </Text>
            <View className="flex-row items-center">
              {player.nickname && (
                <Text numberOfLines={1} className="text-xl font-semibold text-text-2">
                  {player?.nickname}
                </Text>
              )}
            </View>
          </View>
          {isBirthdayToday(player?.dob) && (
            <Image
              source={require('@assets/birthday-cake.png')}
              className="h-16 w-16"
              resizeMode="contain"
            />
          )}
          {team?.captain === player?.id && (
            <View className="h-12 justify-center rounded border bg-yellow-500 shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
              <View className="w-full items-center justify-center bg-white px-1">
                <Text>Captain</Text>
              </View>
            </View>
          )}
          {team?.vice_captain === player?.id && (
            <View className="h-12 justify-center rounded border bg-brand-light shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
              <View className="w-full items-center justify-center bg-white px-4">
                <Text>VC</Text>
              </View>
            </View>
          )}
          <Ionicons name="chevron-forward-outline" size={24} color={iconColor} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default PlayerCard;

const styles = StyleSheet.create({});
