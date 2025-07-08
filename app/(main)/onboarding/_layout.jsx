import { Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { useColorScheme } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import colors from '@lib/colors';

const _layout = () => {
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light;

  return (
    <View className={`${colorScheme} flex-1`}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: themeColors.backgroundDark },
          headerTitleStyle: { color: themeColors.primaryText, fontWeight: 'bold' },
          headerTintColor: themeColors.primaryText,
          headerShadowVisible: false,
          headerTitleAlign: 'center',
        }}
      />
    </View>
  );
};

export default _layout;
