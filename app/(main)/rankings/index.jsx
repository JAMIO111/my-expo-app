import { ScrollView, StyleSheet, Text, View } from 'react-native';
import LeaderboardCard from '@components/LeaderboardCard';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { usePlayerLeaderboards } from '@hooks/usePlayerLeaderboards';
import { useTeamLeaderboards } from '@hooks/useTeamLeaderboards';
import { useUser } from '@contexts/UserProvider';
import BrandHeader from '@components/BrandHeader';

const Index = () => {
  const { currentRole } = useUser();
  const activeDistrictId =
    currentRole?.type === 'admin'
      ? currentRole?.district?.id
      : currentRole?.team?.division?.district?.id;

  const { data: playerLeaderboards } = usePlayerLeaderboards(activeDistrictId);
  const { data: teamLeaderboards } = useTeamLeaderboards(activeDistrictId);
  console.log('Player Leaderboards:', playerLeaderboards);
  console.log('Team Leaderboards:', teamLeaderboards);

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
          <Text className="px-2 font-saira-medium text-3xl text-white">All-time Player Stats</Text>
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
              data={playerLeaderboards}
              statKey="frames_played"
              title="Frames Played"
              label="Frames"
            />
            <LeaderboardCard
              type="player"
              data={playerLeaderboards}
              statKey="frames_won"
              title="Frames Won"
              label="Wins"
            />
            <LeaderboardCard
              type="player"
              statKey="frame_win_percent"
              data={playerLeaderboards}
              title="Frame Win %"
              label=""
            />
            <LeaderboardCard
              type="player"
              statKey="best_frame_win_streak"
              data={playerLeaderboards}
              title="Best Win Streak"
              label="Wins"
            />
          </ScrollView>
          <Text className="px-2 font-saira-medium text-3xl text-white">All-time Team Stats</Text>
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
            />
            <LeaderboardCard
              type="team"
              statKey="matches_won"
              data={teamLeaderboards}
              title="Matches Won"
            />
            <LeaderboardCard
              type="team"
              statKey="match_win_percent"
              data={teamLeaderboards}
              title="Match Win %"
            />
            <LeaderboardCard
              type="team"
              statKey="best_match_win_streak"
              data={teamLeaderboards}
              title="Best Win Streak"
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
