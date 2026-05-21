import { View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useUser } from '@contexts/UserProvider';
import LoadingScreen from '../components/LoadingScreen';
import { useRevenueCat } from '@contexts/RevenueCatProvider';

const _layout = () => {
  const { isPro, isCore } = useRevenueCat();
  const router = useRouter();
  const segments = useSegments();
  const { user, player, loading, roles, setCurrentRole, currentRole } = useUser();

  console.log('AppLayout (main)');
  console.log('User:', user);
  console.log('Player:', player);
  console.log('Current Role:', currentRole);
  console.log('roles:', roles);
  console.log('isPro:', isPro);
  console.log('isCore:', isCore);

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
      'paywall',
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

        if (!inHome && !inOnboarding) {
          router.replace('/home');
          return;
        }
      }
    }
  }, [user, player, loading, segments, roles, currentRole, isPro, isCore]);

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
