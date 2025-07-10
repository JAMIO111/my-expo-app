import { Stack } from 'expo-router';

const _layout = () => {
  return (
    <Stack>
      <Stack.Screen name="league" options={{ headerShown: false }} />
      <Stack.Screen name="[fixtureId]" options={{ headerShown: false }} />
      <Stack.Screen name="fixtures" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;
