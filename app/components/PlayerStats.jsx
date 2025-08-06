import { StyleSheet, Text, View, ScrollView } from 'react-native';
import CircularProgress from '@components/CircularProgress';
import HorizontalStatBar from '@components/HorizontalStatBar';
import ColoredStatCard from '@components/ColoredStatCard';
import { usePlayerStats } from '../hooks/usePlayerStats';
import MatchBreakdownBar from './MatchBreakdownBar';

const PlayerStats = ({ playerId }) => {
  console.log('PlayerStats Component Rendered with playerId:', playerId);
  const { data, error } = usePlayerStats(playerId);
  if (error) {
    console.error('Error fetching player stats:', error);
  } else {
    console.log('Player Stats Data:', data);
  }
  return (
    <View
      contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
      className="w-full px-4 pt-4">
      <Text className="mb-2 font-saira-semibold text-3xl text-text-1">Frames</Text>
      <View className="mb-8 w-full items-center justify-between gap-4">
        <View className="flex-row gap-4 ">
          <ColoredStatCard
            label="Played"
            value={data?.totalStats?.frames_played ?? 0}
            color="blue"
          />
          <ColoredStatCard label="Wins" value={data?.totalStats?.frames_won ?? 0} color="green" />
        </View>
        <View className="flex-row gap-4">
          <ColoredStatCard
            label="Draws"
            value={data?.totalStats?.frames_drawn ?? 0}
            color="yellow"
          />
          <ColoredStatCard label="Losses" value={data?.totalStats?.frames_lost ?? 0} color="red" />
        </View>
      </View>
      <View className="gap-2">
        <MatchBreakdownBar
          wins={data?.totalStats?.frames_won ?? 0}
          losses={data?.totalStats?.frames_lost ?? 0}
          draws={data?.totalStats?.frames_drawn ?? 0}
        />

        <HorizontalStatBar
          title="Frame Win %"
          color="purple"
          value={parseFloat(data?.totalStats?.frame_win_percent?.toFixed(2)) || 0}
        />
      </View>
      <View>
        <HorizontalStatBar
          title="Win Streak"
          type="number"
          target={data?.playerMeta?.best_frame_win_streak ?? 0}
          value={data?.playerMeta?.current_frame_win_streak ?? 0}
          color="orange"
          valueLabel="Current Streak"
          targetLabel="Best Streak"
        />
      </View>
      <View className="my-8 h-[1px] w-full bg-theme-gray-5"></View>
      <Text className="mb-2 font-saira-semibold text-3xl text-text-1">Matches</Text>
      <View className="mb-8 w-full items-center justify-between gap-4">
        <View className="flex-row gap-4 ">
          <ColoredStatCard
            label="Played"
            value={data?.totalStats?.matches_played ?? 0}
            color="blue"
          />
          <ColoredStatCard label="Wins" value={data?.totalStats?.matches_won ?? 0} color="green" />
        </View>
        <View className="flex-row gap-4">
          <ColoredStatCard
            label="Draws"
            value={data?.totalStats?.matches_drawn ?? 0}
            color="yellow"
          />
          <ColoredStatCard label="Losses" value={data?.totalStats?.matches_lost ?? 0} color="red" />
        </View>
      </View>
      <View className="gap-2">
        <HorizontalStatBar
          title="Match Win %"
          color="purple"
          value={parseFloat(data?.totalStats?.match_win_percent?.toFixed(2)) || 0}
        />
      </View>
      <View>
        <HorizontalStatBar
          title="Win Streak"
          type="number"
          target={data?.playerMeta?.best_match_win_streak ?? 0}
          value={data?.playerMeta?.current_match_win_streak ?? 0}
          color="orange"
          valueLabel="Current Streak"
          targetLabel="Best Streak"
        />
      </View>
      <View className="h-12"></View>
    </View>
  );
};

export default PlayerStats;

const styles = StyleSheet.create({});
