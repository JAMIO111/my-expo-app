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
  const { user, player, loading, roles, setCurrentRole, currentRole } = useUser();
  const { isActive, isLoading: subscriptionLoading } = useSubscription();

  console.log('AppLayout (main)');
  console.log('User:', user);
  console.log('Player:', player);
  console.log('Current Role:', currentRole);
  console.log('Subscription active:', isActive);
  console.log('roles:', roles);

  const prevIsActive = useRef(null);

  useEffect(() => {
    if (loading) return;

    const inOnboarding = segments.includes('onboarding');
    const inAuth = segments.includes('auth');
    const HOME_SEGMENTS = [
      'home',
      'my-leagues',
      'teams',
      'competitions',
      'rankings',
      'profile',
      'settings',
    ];

    const inHome = HOME_SEGMENTS.some((s) => segments.includes(s));

    if (!user && !inAuth) {
      router.replace('/auth');
      return;
    }
    if (player && !inOnboarding) {
      if (player.onboarding === 0) {
        router.replace('/(main)/onboarding/(profile-onboarding)/name');
        return;
      }

      if (player.onboarding === 1) {
        router.replace('/(main)/onboarding/(entity-onboarding)/admin-or-player');
        return;
      }

      if (player.onboarding === 3) {
        router.replace('/(main)/onboarding/(entity-onboarding)/pending-request');
        return;
      }

      if (player.onboarding === 9) {
        // 👇 handle role FIRST
        if (!currentRole) {
          if (roles.length === 1) {
            setCurrentRole(roles[0]);
            return; // ⚠️ STOP HERE — wait for rerender
          }

          if (roles.length > 1) {
            router.replace('/(main)/role-select');
            return;
          }
        }

        // 👇 THEN handle navigation once role exists
        if (!currentRole) return;

        const canAccess = isActive || currentRole.type === 'admin';

        if (canAccess && !inHome) {
          router.replace('/(main)/home');
          return;
        }

        if (!canAccess && !inOnboarding) {
          router.replace('/(main)/onboarding/upgrade');
        }
      }
    }
  }, [user, player, loading, segments, roles, isActive, currentRole]);

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

  if (loading) {
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
