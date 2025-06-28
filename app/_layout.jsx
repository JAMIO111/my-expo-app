import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Saira_400Regular, Saira_700Bold } from '@expo-google-fonts/saira';
import Toast from 'react-native-toast-message';
import toastConfig from 'lib/toastConfig';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  const [fontsLoaded] = useFonts({
    Saira_400Regular,
    Saira_700Bold,
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });

  if (!fontsLoaded) return null;

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView className={`${colorScheme} bg-brand flex-1`}>
          <Slot />
        </SafeAreaView>
        <Toast
          config={toastConfig}
          position="top"
          visibilityTime={5000}
          autoHide={true}
          topOffset={80}
        />
      </QueryClientProvider>
    </>
  );
}
