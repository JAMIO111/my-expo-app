import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Leaderboard from '@components/Leaderboard';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';
import { usePlayerLeaderboards } from '@hooks/usePlayerLeaderboards';
import { useTeamLeaderboards } from '@hooks/useTeamLeaderboards';
import { useUser } from '@contexts/UserProvider';

const index = () => {
  const { currentRole } = useUser();
  console.log('Current Role District:', currentRole?.team?.division?.district?.id);
  const { data: playerLeaderboards } = usePlayerLeaderboards(
    currentRole?.team?.division?.district?.id
  );

  const { data: teamLeaderboards } = useTeamLeaderboards(currentRole?.team?.division?.district?.id);
  console.log('Player Leaderboards:', playerLeaderboards);
  console.log('Team Leaderboards:', teamLeaderboards);

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
          <Text className="px-2 font-saira-medium text-3xl text-white">All-time Player Stats</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 16,
              alignItems: 'flex-start',
            }}
            className="mb-8 flex-row space-x-5">
            <Leaderboard
              type="player"
              data={playerLeaderboards}
              statKey="frames_played"
              title="Frames Played"
            />
            <Leaderboard
              type="player"
              data={playerLeaderboards}
              statKey="frames_won"
              title="Frames Won"
            />
            <Leaderboard
              type="player"
              statKey="frame_win_percent"
              data={playerLeaderboards}
              title="Frame Win %"
            />
            <Leaderboard
              type="player"
              statKey="best_frame_win_streak"
              data={playerLeaderboards}
              title="Best Win Streak"
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
            <Leaderboard
              type="team"
              statKey="matches_played"
              data={teamLeaderboards}
              title="Matches Played"
            />
            <Leaderboard
              type="team"
              statKey="matches_won"
              data={teamLeaderboards}
              title="Matches Won"
            />
            <Leaderboard
              type="team"
              statKey="match_win_percent"
              data={teamLeaderboards}
              title="Match Win %"
            />
            <Leaderboard
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

export default index;

const styles = StyleSheet.create({});
