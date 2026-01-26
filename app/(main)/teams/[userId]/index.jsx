import { useLocalSearchParams, Stack } from 'expo-router';
import PlayerProfile from '@/components/PlayerProfile';
import CustomHeader from '@/components/CustomHeader';
import SafeViewWrapper from '@/components/SafeViewWrapper';
import { View, Text } from 'react-native';
import useUserProfile from '@/hooks/useUserProfile';
import LoadingSplash from '@/components/LoadingSplash';

export default function TeammatePage() {
  const { userId } = useLocalSearchParams();
  const { data: playerProfile, isLoading, error } = useUserProfile?.(userId);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                title={
                  `${playerProfile?.first_name || ''} ${playerProfile?.surname || ''}` || 'Profile'
                }
              />
            </SafeViewWrapper>
          ),
        }}
      />

      {isLoading ? (
        <LoadingSplash />
      ) : (
        <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
          <View className="mt-16">
            <PlayerProfile
              context="teams"
              playerProfile={playerProfile}
              error={error}
              isLoading={isLoading}
            />
          </View>
        </SafeViewWrapper>
      )}
    </>
  );
}
