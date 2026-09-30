import '../global.css';
import { initMonitoring, wrapRoot, captureError, setMonitoringUser } from '@lib/monitoring';

initMonitoring();
// Side-effect import: starts capturing deep links immediately, before any
// navigation happens -- see app/lib/lastDeepLink.js for why this can't just
// live inside the screen (reset-password) that needs it.
import '@lib/lastDeepLink';
import { Slot } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import {
  Saira_400Regular,
  Saira_500Medium,
  Saira_600SemiBold,
  Saira_700Bold,
} from '@expo-google-fonts/saira';
import {
  Tektur_400Regular,
  Tektur_500Medium,
  Tektur_600SemiBold,
  Tektur_700Bold,
} from '@expo-google-fonts/tektur';
import { Michroma_400Regular } from '@expo-google-fonts/michroma';
import Toast from 'react-native-toast-message';
import toastConfig from '@lib/toastConfig';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { UserProvider, useUser } from '@contexts/UserProvider';
import { AdminProvider } from '@contexts/AdminContext';
import AppRealtimeProvider from '@contexts/AppRealtimeProvider';
import RevenueCatProvider from '@contexts/RevenueCatProvider';
import { NotificationsPanelProvider } from '@contexts/NotificationsPanelProvider';
import { BadgeUnlockProvider } from '@contexts/BadgeUnlockProvider';
import { ThemeProvider } from '@contexts/ThemeProvider';
import { UpgradeSheetProvider } from '@contexts/UpgradeSheetProvider';
import { useUnseenBadgesTrigger } from '@hooks/useUnseenBadgesTrigger';
import mobileAds from 'react-native-google-mobile-ads';

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Saira_400Regular,
    Saira_500Medium,
    Saira_600SemiBold,
    Saira_700Bold,
    Michroma_400Regular,
    Tektur_400Regular,
    Tektur_500Medium,
    Tektur_600SemiBold,
    Tektur_700Bold,
    DelaGothicOne: require('@assets/fonts/DelaGothicOne-Regular.ttf'),
  });

  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => {
        console.log('Google Mobile Ads initialized');
      })
      .catch((error) => {
        console.error('Google Mobile Ads initialization failed:', error);
      });
  }, []);

  const queryClientRef = useRef();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      // Unexpected failures of any query or mutation are reported (expected refusals are filtered out).
      queryCache: new QueryCache({
        onError: (error, query) => captureError(error, `query:${String(query.queryKey?.[0])}`),
      }),
      mutationCache: new MutationCache({
        onError: (error) => captureError(error, 'mutation'),
      }),
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: false,
        },
      },
    });
  }

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClientRef.current}>
            <UserProvider>
              <AdminProvider>
                <RevenueCatProvider
                  iosApiKey="appl_DQoRBoSRUxeKJVXLtoWXeWeNGCn"
                  androidApiKey="goog_yTNNoAuahqqKnkHPLDcDmmaPrXG">
                  <AppRealtimeProvider>
                    <NotificationsPanelProvider>
                      <BadgeUnlockProvider>
                        <BadgeTrigger />
                        <MonitoringUser />
                        <BottomSheetModalProvider>
                          <UpgradeSheetProvider>
                            <View className={`flex-1 bg-brand`}>
                              <Slot />
                            </View>
                          </UpgradeSheetProvider>
                        </BottomSheetModalProvider>
                        <Toast
                          config={toastConfig}
                          position="top"
                          visibilityTime={5000}
                          autoHide={true}
                          topOffset={80}
                        />
                      </BadgeUnlockProvider>
                    </NotificationsPanelProvider>
                  </AppRealtimeProvider>
                </RevenueCatProvider>
              </AdminProvider>
            </UserProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function BadgeTrigger() {
  useUnseenBadgesTrigger();
  return null;
}

function MonitoringUser() {
  const { player, currentRole } = useUser();
  useEffect(() => {
    setMonitoringUser(player?.id, currentRole?.type);
  }, [player?.id, currentRole?.type]);
  return null;
}

export default wrapRoot(RootLayout);

// Shown instead of a blank screen if a screen crashes while rendering.
export function ErrorBoundary({ error, retry }) {
  useEffect(() => {
    captureError(error, 'render');
  }, [error]);

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-brand p-8">
      <Text className="text-center font-delagothic text-3xl text-text-on-brand">
        Something went wrong
      </Text>
      <Text className="text-center font-saira text-lg text-text-on-brand-2">
        The problem has been reported. Please try again.
      </Text>
      <Pressable onPress={retry} className="rounded-xl bg-white px-8 py-3">
        <Text className="font-saira-semibold text-lg text-black">Try again</Text>
      </Pressable>
    </View>
  );
}
