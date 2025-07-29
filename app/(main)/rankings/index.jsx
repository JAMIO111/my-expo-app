import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Leaderboard from '@components/Leaderboard';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';

const index = () => {
  return (
    <SafeViewWrapper topColor="bg-brand-dark" bottomColor="bg-brand">
      <StatusBar style="light" backgroundColor="#000" />
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader backgroundColor="bg-brand-dark" showBack={false} title="Stat Room" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="flex-1">
        <ScrollView className="mt-16 flex-1 bg-brand-dark p-5">
          <Text className="mb-5 font-saira-semibold text-3xl text-white">
            All-time Player Stats
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 16,
              alignItems: 'flex-start',
            }}
            className="mb-5 flex-row space-x-5">
            <Leaderboard type="player" title="Frames Played" />
            <Leaderboard type="player" title="Frames Won" />
            <Leaderboard type="player" title="Frame Win %" />
            <Leaderboard type="player" title="Best Win Streak" />
          </ScrollView>
          <Text className="mb-5 font-saira-semibold text-3xl text-white">All-time Team Stats</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 16,
              alignItems: 'flex-start',
            }}
            className="mb-5 flex-row space-x-5">
            <Leaderboard type="team" title="Matches Played" />
            <Leaderboard type="team" title="Matches Won" />
            <Leaderboard type="team" title="Match Win %" />
            <Leaderboard type="team" title="Best Win Streak" />
          </ScrollView>
        </ScrollView>
      </View>
      <NavBar />
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
