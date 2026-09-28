import '../../global.css'; // Ensure global styles are imported
import { Stack, useRouter, useSegments } from 'expo-router';
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

  // A real Stack (not just <Slot />) so home/profile/teams/settings/etc. are
  // screens on ONE shared navigator instead of independent root stacks each
  // with their own push history. Without this, pushing from Profile or Teams
  // into /settings lands in a completely separate native stack that has
  // nothing behind it -- the in-app back button still works (it walks Expo
  // Router's own JS history), but the native swipe-back gesture doesn't
  // (there's nothing in *that* stack's own history to reveal). Each section
  // keeps its own nested Stack for its internal navigation, unaffected.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Top-level sections switched via the bottom nav's router.replace() --
          no slide, matching how tab switching felt before this Stack existed.
          settings keeps the default push animation, since that's the one
          that now properly supports swipe-back. */}
      <Stack.Screen name="home" options={{ animation: 'none' }} />
      <Stack.Screen name="profile" options={{ animation: 'none' }} />
      <Stack.Screen name="teams" options={{ animation: 'none' }} />
      <Stack.Screen name="my-leagues" options={{ animation: 'none' }} />
      <Stack.Screen name="competitions" options={{ animation: 'none' }} />
      <Stack.Screen name="rankings" options={{ animation: 'none' }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
      <Stack.Screen name="role-select" options={{ animation: 'none' }} />
      <Stack.Screen name="index" options={{ animation: 'none' }} />
    </Stack>
  );
};

export default _layout;
