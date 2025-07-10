import { Slot } from 'expo-router';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Saira_400Regular, Saira_700Bold } from '@expo-google-fonts/saira';
import { Michroma_400Regular } from '@expo-google-fonts/michroma';
import Toast from 'react-native-toast-message';
import toastConfig from '@lib/toastConfig';
import { useEffect, useState, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme(); // 'light' | 'dark' | null
  const [fontsLoaded] = useFonts({
    Saira_400Regular,
    Saira_700Bold,
    Michroma_400Regular,
    DelaGothicOne: require('@assets/fonts/DelaGothicOne-Regular.ttf'),
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Slight delay to ensure navigation context is initialized
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, [colorScheme]);

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

  if (!fontsLoaded || !isReady) return null;

  // ✅ ✅ This is the KEY — manually apply the `dark` class to the outermost View
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClientRef.current}>
        <View className={`flex-1 bg-brand ${colorScheme === 'dark' ? 'dark' : ''}`}>
          <Slot />
        </View>
        <Toast
          config={toastConfig}
          position="top"
          visibilityTime={5000}
          autoHide={true}
          topOffset={80}
        />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
