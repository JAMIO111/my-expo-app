import { StyleSheet, Text, View } from 'react-native';
import { usePlayerStats } from '../hooks/usePlayerStats';
import DonutChart from './DonutChart';

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
      className="w-full gap-1">
      <View className="bg-bg-grouped-2 px-4 py-8">
        <Text className="mb-2 font-saira-semibold text-3xl text-text-1">Frames</Text>
        <View className="mb-8 w-full flex-row items-center justify-between">
          <DonutChart
            wins={data?.totalStats?.frames_won ?? 0}
            draws={data?.totalStats?.frames_drawn ?? 0}
            losses={data?.totalStats?.frames_lost ?? 0}
            statTitle="Frames Played"
          />
          <View className="flex-1 gap-3 pl-8 pr-2">
            <View className="flex flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full bg-green-700"></View>
              <Text className="flex-1 text-lg text-text-2">Won</Text>
              <Text className="font-saira-semibold text-2xl text-text-1">
                {data?.totalStats?.frames_won ?? 0}
              </Text>
            </View>
            <View className="border-b border-theme-gray-5"></View>
            <View className="flex flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full bg-yellow-500"></View>
              <Text className="flex-1 text-lg text-text-2">Drawn</Text>
              <Text className="font-saira-semibold text-2xl text-text-1">
                {data?.totalStats?.frames_drawn ?? 0}
              </Text>
            </View>
            <View className="border-b border-theme-gray-5"></View>
            <View className="flex flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full bg-red-500"></View>
              <Text className="flex-1 text-lg text-text-2">Lost</Text>
              <Text className="font-saira-semibold text-2xl text-text-1">
                {data?.totalStats?.frames_lost ?? 0}
              </Text>
            </View>
          </View>
        </View>
        <View className="mt-6 flex flex-row gap-2 pl-4">
          <View className="flex-1 gap-8">
            <View>
              <Text className="font-saira-semibold text-3xl text-text-1">
                {data?.totalStats?.frame_win_percent ?? 0}%
              </Text>
              <Text style={{ lineHeight: 18 }} className="text-lg font-semibold text-text-2">
                Win Rate
              </Text>
            </View>
          </View>
          <View className="flex-1 gap-8">
            <View>
              <Text className="font-saira-semibold text-3xl text-text-1">
                {data?.playerMeta?.best_frame_win_streak ?? 0}
              </Text>
              <Text style={{ lineHeight: 18 }} className="text-lg font-semibold text-text-2">
                Best Win Streak
              </Text>
            </View>
            <View>
              <Text className="font-saira-semibold text-3xl text-text-1">
                {data?.playerMeta?.current_frame_win_streak ?? 0}
              </Text>
              <Text style={{ lineHeight: 18 }} className="text-lg font-semibold text-text-2">
                Current Win Streak
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className="bg-bg-grouped-2 px-4 py-8">
        <Text className="mb-2 font-saira-semibold text-3xl text-text-1">Matches</Text>
        <View className="mb-8 w-full flex-row items-center justify-between">
          <DonutChart
            wins={data?.totalStats?.matches_won ?? 0}
            draws={data?.totalStats?.matches_drawn ?? 0}
            losses={data?.totalStats?.matches_lost ?? 0}
            statTitle="Matches Played"
          />
          <View className="flex-1 gap-3 pl-8 pr-2">
            <View className="flex flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full bg-green-700"></View>
              <Text className="flex-1 text-lg text-text-2">Won</Text>
              <Text className="font-saira-semibold text-2xl text-text-1">
                {data?.totalStats?.matches_won ?? 0}
              </Text>
            </View>
            <View className="border-b border-theme-gray-5"></View>
            <View className="flex flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full bg-yellow-500"></View>
              <Text className="flex-1 text-lg text-text-2">Drawn</Text>
              <Text className="font-saira-semibold text-2xl text-text-1">
                {data?.totalStats?.matches_drawn ?? 0}
              </Text>
            </View>
            <View className="border-b border-theme-gray-5"></View>
            <View className="flex flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full bg-red-500"></View>
              <Text className="flex-1 text-lg text-text-2">Lost</Text>
              <Text className="font-saira-semibold text-2xl text-text-1">
                {data?.totalStats?.matches_lost ?? 0}
              </Text>
            </View>
          </View>
        </View>
        <View className="mb-8 mt-6 flex flex-row gap-2 pl-4">
          <View className="flex-1 gap-8">
            <View>
              <Text className="font-saira-semibold text-3xl text-text-1">
                {data?.totalStats?.match_win_percent ?? 0}%
              </Text>
              <Text style={{ lineHeight: 18 }} className="text-lg font-semibold text-text-2">
                Win Rate
              </Text>
            </View>
          </View>
          <View className="flex-1 gap-8">
            <View>
              <Text className="font-saira-semibold text-3xl text-text-1">
                {data?.playerMeta?.best_match_win_streak ?? 0}
              </Text>
              <Text style={{ lineHeight: 18 }} className="text-lg font-semibold text-text-2">
                Best Win Streak
              </Text>
            </View>
            <View>
              <Text className="font-saira-semibold text-3xl text-text-1">
                {data?.playerMeta?.current_match_win_streak ?? 0}
              </Text>
              <Text style={{ lineHeight: 18 }} className="text-lg font-semibold text-text-2">
                Current Win Streak
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PlayerStats;

const styles = StyleSheet.create({});
