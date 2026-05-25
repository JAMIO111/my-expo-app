import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '@contexts/UserProvider';
import { useRevenueCat } from '@contexts/RevenueCatProvider';
import { useRouter } from 'expo-router';

const _layout = () => {
  const { user, player, loading, currentRole } = useUser();
  const { isPro, isCore } = useRevenueCat();
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen name="league" options={{ headerShown: false }} />
      <Stack.Screen name="[fixtureId]" options={{ headerShown: false }} />
      <Stack.Screen name="fixtures" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="premium" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;
