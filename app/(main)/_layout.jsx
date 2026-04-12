import { View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useUser } from '@contexts/UserProvider';
import LoadingScreen from '../components/LoadingScreen';
import { useSubscription } from '@hooks/useSubscription';

const _layout = () => {
  const router = useRouter();
  const segments = useSegments();
  const { user, player, loading, roles, setCurrentRole } = useUser();
  const { isActive, isLoading: subscriptionLoading } = useSubscription();

  const prevIsActive = useRef(null);

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
  }, [roles, isActive]);

  useEffect(() => {
    // Don't act until subscription has finished its first fetch.
    if (subscriptionLoading) return;

    // On the very first resolved value, just record it — don't redirect.
    // This prevents redirecting every time the app cold-starts.
    if (prevIsActive.current === null) {
      prevIsActive.current = isActive;
      return;
    }

    // From here we know isActive genuinely changed after mount.
    if (isActive && !prevIsActive.current) {
      // Subscription just became active (e.g. purchase completed, restored).
      console.log('[layout] subscription activated → redirecting to home');
      router.replace('/(main)/home');
    }

    if (!isActive && prevIsActive.current) {
      // Subscription just lapsed or was cancelled.
      console.log('[layout] subscription lost → redirecting to paywall');
      router.replace('/(main)/onboarding/upgrade');
    }

    prevIsActive.current = isActive;
  }, [isActive]);

  if (loading || subscriptionLoading) {
    console.log('Loading user data...');
    return <LoadingScreen />;
  }

  return (
    <View className={`flex-1`}>
      <Slot />
    </View>
  );
};

export default _layout;
