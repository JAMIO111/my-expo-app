import { Stack } from 'expo-router';
import { View, Text } from 'react-native';

const layout = () => {
  return (
    <Stack
      screenOptions={{
        headerBackground: () => <View className="bg-brand w-full flex-1" />,
        headerTintColor: 'white',
      }}>
      <Stack.Screen name="index" options={{}} />
      <Stack.Screen
        name="[userId]"
        options={{
          title: 'User Profile',
          headerBackground: () => <View className="bg-brand w-full flex-1" />,
          headerTitle: () => <Text className="text-lg font-bold text-white">User Profile</Text>,
        }}
      />
    </Stack>
  );
};

export default layout;
