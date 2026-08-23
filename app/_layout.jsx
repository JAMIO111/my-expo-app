import { Slot } from 'expo-router';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import {
  Saira_400Regular,
  Saira_500Medium,
  Saira_600SemiBold,
  Saira_700Bold,
} from '@expo-google-fonts/saira';
import { Michroma_400Regular } from '@expo-google-fonts/michroma';
import Toast from 'react-native-toast-message';
import toastConfig from '@lib/toastConfig';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserProvider } from '@contexts/UserProvider';
import { AdminProvider } from '@contexts/AdminContext';
import AppRealtimeProvider from '@contexts/AppRealtimeProvider';
import RevenueCatProvider from '@contexts/RevenueCatProvider';
import { NotificationsPanelProvider } from '@contexts/NotificationsPanelProvider';
import { BadgeUnlockProvider } from '@contexts/BadgeUnlockProvider';
import { useUnseenBadgesTrigger } from '@hooks/useUnseenBadgesTrigger';
import mobileAds from 'react-native-google-mobile-ads';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Saira_400Regular,
    Saira_500Medium,
    Saira_600SemiBold,
    Saira_700Bold,
    Michroma_400Regular,
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
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: false,
        },
      },
    });
  }

  if (!fontsLoaded) return null;

  // ✅ ✅ This is the KEY — manually apply the `dark` class to the outermost View
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                    <View className={`flex-1 bg-brand`}>
                      <Slot />
                    </View>
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
    </GestureHandlerRootView>
  );
}

function BadgeTrigger() {
  useUnseenBadgesTrigger();
  return null;
}
