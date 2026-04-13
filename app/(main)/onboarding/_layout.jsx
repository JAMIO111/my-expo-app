import { router, Stack } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '@components/CustomNativeHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useUser } from '@contexts/UserProvider';
import { useEffect } from 'react';
import { useSubscription } from '@hooks/useSubscription';
import LoadingScreen from '../../components/LoadingScreen';

const _layout = () => {
  const { player, user, loading } = useUser();
  const colorScheme = useColorScheme();
  const { subscription, isLoading: subscriptionLoading, isActive } = useSubscription();

  useEffect(() => {
    if (loading || subscriptionLoading) return;

    if (player && player.onboarding === 0) {
      router.replace('/(main)/onboarding/(profile-onboarding)/name');
    } else if (player && player.onboarding === 1) {
      router.replace('/(main)/onboarding/(entity-onboarding)/admin-or-player');
    } else if (player && player.onboarding === 9) {
      subscription && isActive
        ? router.replace('/home')
        : router.replace('/(main)/onboarding/upgrade');
    }
  }, [loading, player, isActive]);

  if (loading || subscriptionLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <View className={`flex-1`}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            animation: 'none', // 🔥 kills the slide
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
