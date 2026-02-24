import { router, Stack } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '@components/CustomNativeHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useUser } from '@contexts/UserProvider';
import { useEffect } from 'react';

const _layout = () => {
  const { player, user, loading } = useUser();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loading) return;

    if (player && player.onboarding === 0) {
      router.replace('/(main)/onboarding/(profile-onboarding)/name');
    } else if (player && player.onboarding === 1) {
      router.replace('/(main)/onboarding/(entity-onboarding)/admin-or-player');
    } else if (player && player.onboarding === 9) {
      router.replace('/(main)/home');
    }
  }, [loading, player]);

  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <View className={`flex-1`}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            header: (props) => <CustomHeader {...props} />,
          }}>
          <Stack.Screen name="name" options={{ headerShown: false }} />
          <Stack.Screen name="nickname" options={{ headerShown: false }} />
          <Stack.Screen name="dob" options={{ headerShown: false }} />
          <Stack.Screen name="avatar" options={{ headerShown: false }} />
          <Stack.Screen name="upgrade" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="explore" options={{ headerShown: false }} />
          <Stack.Screen name="season" options={{ headerShown: false }} />
        </Stack>
      </View>
    </SafeViewWrapper>
  );
};

export default _layout;
