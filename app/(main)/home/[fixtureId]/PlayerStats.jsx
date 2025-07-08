import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import StatCard from '@components/StatCard';

const PlayerStats = () => {
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
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 w-full bg-bg-grouped-1 py-5">
        <View className="w-full gap-5 px-4">
          <View className="flex-row gap-5">
            <StatCard title="Matches Played" value="86" icon="dice-outline" color="bg-theme-blue" />
            <StatCard title="Match Win %" value="72%" icon="star-outline" color="bg-theme-purple" />
          </View>
          <View className="flex-row gap-5">
            <StatCard title="Matches Won" value="52" icon="trophy-outline" color="bg-theme-green" />
            <StatCard title="Matches Lost" value="23" icon="bandage-outline" color="bg-theme-red" />
          </View>
        </View>
        <View
          contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
          className="my-5 w-full flex-row gap-5 bg-brand px-4 py-5">
          <StatCard title="Win Streak" value="52" icon="flame-outline" color="bg-theme-orange" />
          <StatCard title="Dishes" value="52" icon="flash-outline" color="bg-theme-yellow" />
        </View>
        <View className="w-full gap-5 px-4">
          <View className="flex-row gap-5">
            <StatCard title="Frames Played" value="154" icon="dice-outline" color="bg-theme-blue" />
            <StatCard title="Frame Win %" value="81%" icon="star-outline" color="bg-theme-purple" />
          </View>
          <View className="flex-row gap-5">
            <StatCard title="Frames Won" value="52" icon="trophy-outline" color="bg-theme-green" />
            <StatCard title="Frames Lost" value="34" icon="bandage-outline" color="bg-theme-red" />
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default PlayerStats;

const styles = StyleSheet.create({});
