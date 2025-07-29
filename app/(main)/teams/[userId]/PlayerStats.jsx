import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import PlayerStats from '@components/PlayerStats';
import { useLocalSearchParams } from 'expo-router';

const PlayerStatsScreen = () => {
  const { userId } = useLocalSearchParams();
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
        <View className="mb-4 w-full">
          <Text className="font-saira-semibold text-2xl text-text-1">Player ID: {userId}</Text>
          <Text className="font-saira-medium text-lg text-text-2">View detailed stats below:</Text>
          <View className="my-8 h-[1px] w-full bg-theme-gray-5"></View>
        </View>
        <ScrollView className="w-full flex-1 gap-5 overflow-hidden rounded-t-3xl bg-bg-grouped-2 p-1">
          <PlayerStats playerId={userId} />
        </ScrollView>
      </View>
    </SafeViewWrapper>
  );
};

export default PlayerStatsScreen;

const styles = StyleSheet.create({});
