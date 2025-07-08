import { useLocalSearchParams, Stack } from 'expo-router';
import PlayerProfile from '@/components/PlayerProfile';
import CustomHeader from '@/components/CustomHeader';
import SafeViewWrapper from '@/components/SafeViewWrapper';
import { View, Text } from 'react-native';

export default function TeammatePage() {
  const { userId } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title={userId || 'Profile'} />
            </SafeViewWrapper>
          ),
        }}
      />

      <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
        <View className="mt-16">
          {userId ? (
            <PlayerProfile userId={userId} />
          ) : (
            <Text className="text-text-1">Loading...</Text>
          )}
        </View>
      </SafeViewWrapper>
    </>
  );
}
