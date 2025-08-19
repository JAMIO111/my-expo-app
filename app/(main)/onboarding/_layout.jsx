import { Stack } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import colors from '@lib/colors';
import CustomHeader from '@components/CustomNativeHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';

const _layout = () => {
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light;

  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <View className={`flex-1`}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            header: (props) => <CustomHeader {...props} />,
          }}>
          <Stack.Screen name="upgrade" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="explore" options={{ headerShown: false }} />
        </Stack>
      </View>
    </SafeViewWrapper>
  );
};

export default _layout;
