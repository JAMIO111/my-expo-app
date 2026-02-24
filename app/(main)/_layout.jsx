import { View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '@contexts/UserProvider';
import LoadingScreen from '../components/LoadingScreen';

const _layout = () => {
  const router = useRouter();
  const segments = useSegments();
  const { user, player, loading, roles, setCurrentRole } = useUser();

  useEffect(() => {
    if (loading) return;

    const inOnboarding = segments.includes('onboarding');
    const inAuth = segments.includes('auth');

    if (!user && !inAuth) {
      router.replace('/auth');
      return;
    }

    if (user && !player && !inOnboarding) {
      router.replace('/(main)/onboarding');
      return;
    }

    if (player && player.onboarding !== 9 && !inOnboarding) {
      router.replace('/(main)/onboarding');
      return;
    }
  }, [user, player, loading, segments]);

  useEffect(() => {
    if (roles.length === 1) {
      setCurrentRole(roles[0]);
      router.replace('/(main)/home');
    }
  }, [roles]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className={`flex-1`}>
      <Slot />
    </View>
  );
};

export default _layout;
