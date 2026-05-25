import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import EntityStats from '@components/EntityStats';
import useUserProfile from '@/hooks/useUserProfile';
import Avatar from '@components/Avatar';

const PlayerStatsPage = ({ userId }) => {
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
        <View className="flex w-full flex-row gap-5 border-b border-theme-gray-5 bg-brand p-4">
          <View style={{ borderRadius: 30, lineHeight: 20, padding: 2 }} className="bg-bg-1">
            <Avatar player={playerProfile} size={60} borderRadius={30} />
          </View>
          <View className="items-start justify-center gap-1">
            <Text
              style={{ fontSize: 26, lineHeight: 30 }}
              className="font-saira-medium text-text-on-brand">
              {playerProfile?.first_name} {playerProfile?.surname}
            </Text>
            <Text
              style={{ fontSize: 18 }}
              className="rounded-lg bg-brand-light px-3 font-saira-medium text-text-on-brand">
              {playerProfile?.nickname || ''}
            </Text>
          </View>
        </View>
        <ScrollView className="w-full flex-1 gap-5 bg-bg-grouped-1">
          <EntityStats entityId={userId} entityType="player" />
        </ScrollView>
      </View>
    </SafeViewWrapper>
  );
};

export default PlayerStatsPage;

const styles = StyleSheet.create({});
