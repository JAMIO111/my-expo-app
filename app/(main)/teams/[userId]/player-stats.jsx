import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import PlayerStats from '@components/PlayerStats';
import { useLocalSearchParams } from 'expo-router';
import useUserProfile from '@/hooks/useUserProfile';
import Avatar from '../../../components/Avatar';

const PlayerStatsScreen = () => {
  const { userId } = useLocalSearchParams();
  const { data: playerProfile, isLoading, error } = useUserProfile?.(userId);

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title={`Player Stats`} />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 w-full flex-1 bg-bg-grouped-1">
        <View className="flex w-full flex-row gap-5 border-b border-theme-gray-5 bg-brand p-3">
          <View style={{ borderRadius: 8, lineHeight: 20 }} className="bg-bg-1 p-1">
            <Avatar player={playerProfile} size={60} borderRadius={5} />
          </View>
          <View className="items-start justify-center">
            <Text
              style={{ fontSize: 26, lineHeight: 30 }}
              className="font-saira-medium text-text-on-brand">
              {playerProfile?.first_name} {playerProfile?.surname}
            </Text>
            <Text
              style={{ fontSize: 22 }}
              className="font-saira-medium text-text-on-brand-2 opacity-60">
              {playerProfile?.nickname || ''}
            </Text>
          </View>
        </View>
        <ScrollView className="w-full flex-1 gap-5 bg-bg-grouped-2 p-3">
          <PlayerStats playerId={userId} />
        </ScrollView>
      </View>
    </SafeViewWrapper>
  );
};

export default PlayerStatsScreen;

const styles = StyleSheet.create({});
