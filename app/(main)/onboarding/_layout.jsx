import { Stack } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import colors from '@lib/colors';

const _layout = () => {
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light;

  return (
    <View className={`flex-1`}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: themeColors.bgGrouped1 },
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
