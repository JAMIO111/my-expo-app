import { View, Text, ActivityIndicator, Image } from 'react-native';

export default function LoadingScreen() {
  return (
    <View className="flex flex-1 items-center justify-center gap-32 bg-brand">
      <Image
        source={require('@assets/Break-Room-Logo-2-1024-Background.png')}
        className="mb-16 h-40 w-40"
        resizeMode="contain"
      />

      <ActivityIndicator size="large" color="#FFFFFF99" />
      <Text className="mt-16 animate-pulse font-michroma text-4xl font-bold text-white">
        Loading...
      </Text>
    </View>
  );
}
