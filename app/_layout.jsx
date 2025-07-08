import { Slot } from 'expo-router';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import { useFonts } from 'expo-font';
import { Saira_400Regular, Saira_700Bold } from '@expo-google-fonts/saira';
import { Michroma_400Regular } from '@expo-google-fonts/michroma';
import Toast from 'react-native-toast-message';
import toastConfig from '@lib/toastConfig';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  const [fontsLoaded] = useFonts({
    Saira_400Regular,
    Saira_700Bold,
    Michroma_400Regular,
    DelaGothicOne: require('@assets/fonts/DelaGothicOne-Regular.ttf'),
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait 1 frame before rendering to avoid race condition with navigation context
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, [colorScheme]); // Re-run on theme change

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });

  if (!fontsLoaded || !isReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <View className={`${colorScheme} flex-1 bg-brand`}>
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
  );
}
