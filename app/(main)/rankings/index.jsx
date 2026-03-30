import { ScrollView, StyleSheet, Text, View } from 'react-native';
import LeaderboardCard from '@components/LeaderboardCard';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { usePlayerLeaderboard } from '@hooks/usePlayerLeaderboard';
import { useTeamLeaderboard } from '@hooks/useTeamLeaderboard';
import { useUser } from '@contexts/UserProvider';
import BrandHeader from '@components/BrandHeader';

const Index = () => {
  const { currentRole } = useUser();
  const activeDistrictId = currentRole?.district?.id;

  const { data: teamLeaderboards, isLoading: isLoadingTeams } =
    useTeamLeaderboard(activeDistrictId);
  const { data: playerLeaderboard, isLoading: isLoadingPlayers } =
    usePlayerLeaderboard(activeDistrictId);

  console.log('Team Leaderboards:', teamLeaderboards);
  console.log('Player Leaderboard:', playerLeaderboard);

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <StatusBar style="light" backgroundColor="#000" />
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <BrandHeader text1="Stat" text2="Room" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="flex-1">
        <ScrollView className="mt-16 flex-1 bg-brand px-3 py-5">
          <Text className="px-2 font-saira-medium text-2xl text-white">All-time Player Stats</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 16,
              alignItems: 'flex-start',
            }}
            className="mb-8 flex-row space-x-5">
            <LeaderboardCard
              type="player"
              data={playerLeaderboard}
              statKey="frames_played"
              title="Frames Played"
              label="Frames"
              loading={isLoadingPlayers}
            />
            <LeaderboardCard
              type="player"
              data={playerLeaderboard}
              statKey="frames_won"
              title="Frames Won"
              label="Wins"
              loading={isLoadingPlayers}
            />
            <LeaderboardCard
              type="player"
              statKey="frame_win_percent"
              data={playerLeaderboard}
              title="Frame Win %"
              label="%"
              percent={true}
              loading={isLoadingPlayers}
            />
            <LeaderboardCard
              type="player"
              statKey="best_frame_win_streak"
              data={playerLeaderboard}
              title="Best Win Streak"
              label="Wins"
              loading={isLoadingPlayers}
            />
            <LeaderboardCard
              type="player"
              statKey="current_frame_win_streak"
              data={playerLeaderboard}
              title="Current Win Streak"
              label="Wins"
              loading={isLoadingPlayers}
            />
          </ScrollView>
          <Text className="px-2 font-saira-medium text-2xl text-white">All-time Team Stats</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 16,
              alignItems: 'flex-start',
            }}
            className="mb-8 flex-row space-x-5">
            <LeaderboardCard
              type="team"
              statKey="matches_played"
              data={teamLeaderboards}
              title="Matches Played"
              loading={isLoadingTeams}
            />
            <LeaderboardCard
              type="team"
              statKey="matches_won"
              data={teamLeaderboards}
              title="Matches Won"
              loading={isLoadingTeams}
              label="Wins"
            />
            <LeaderboardCard
              type="team"
              statKey="match_win_percent"
              data={teamLeaderboards}
              loading={isLoadingTeams}
              title="Match Win %"
              label="%"
              percent={true}
            />
            <LeaderboardCard
              type="team"
              statKey="best_match_win_streak"
              data={teamLeaderboards}
              title="Best Win Streak"
              loading={isLoadingTeams}
              label="Wins"
            />
          </ScrollView>
        </ScrollView>
      </View>
      <NavBar />
    </SafeViewWrapper>
  );
};

export default Index;

const styles = StyleSheet.create({});
