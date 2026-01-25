import { View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import { useColorScheme } from 'nativewind';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '@contexts/UserProvider';

const _layout = () => {
  const router = useRouter();
  const segments = useSegments();
  const { user, player, loading } = useUser();
  const { colorScheme } = useColorScheme();
  console.log('Current Color Scheme:', colorScheme);
  console.log('player from layourt:', player);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === 'login';
    const inOnboarding = segments.includes('onboarding');

    if (!user && !inAuth) {
      router.replace('/login/login');
      return;
    }

    if (user && !player && !inOnboarding) {
      router.replace('/(main)/onboarding/(profile-onboarding)/name');
      return;
    }

    if (player && player.onboarding === 0 && !inOnboarding) {
      router.replace('/(main)/onboarding/(profile-onboarding)/name');
    }

    if (player && player.onboarding === 1 && !inOnboarding) {
      router.replace('/(main)/onboarding/(entity-onboarding)/admin-or-player');
    }

    if (player && player.onboarding === 3 && inAuth) {
      router.replace('/(main)/home');
    }
  }, [user, player, loading, segments]);

  return (
    <View className={`${colorScheme} flex-1`}>
      <Slot />
    </View>
  );
};

export default _layout;
