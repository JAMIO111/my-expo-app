import { StyleSheet, Text, View, ScrollView } from 'react-native';
import CircularProgress from '@components/CircularProgress';
import HorizontalStatBar from '@components/HorizontalStatBar';
import ColoredStatCard from '@components/ColoredStatCard';
import { usePlayerStats } from '../hooks/usePlayerStats';

const PlayerStats = ({ playerId }) => {
  console.log('PlayerStats Component Rendered with playerId:', playerId);
  const { data, error } = usePlayerStats(playerId);
  console.log('Player Stats Data:', data);
  return (
    <View
      contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
      className="w-full px-4 pt-4">
      <Text className="mb-2 font-saira-semibold text-3xl text-text-1">Frames</Text>
      <View className="mb-8 w-full flex-row items-center justify-between gap-4">
        <ColoredStatCard label="Wins" value={1500} color="theme-green" />
        <ColoredStatCard label="Draws" value={5} color="white" />
        <ColoredStatCard label="Losses" value={26} color="theme-red" />
      </View>
      <View className="gap-2">
        <HorizontalStatBar title="Frame Win %" value={54.5} />
      </View>
      <View className="my-8 h-[1px] w-full bg-theme-gray-5"></View>
      <Text className="mb-2 font-saira-semibold text-3xl text-text-1">Matches</Text>
      <View className="mb-8 w-full flex-row items-center justify-between gap-4">
        <ColoredStatCard label="Wins" value={254} color="theme-green" />
        <ColoredStatCard label="Draws" value={4} color="white" />
        <ColoredStatCard label="Losses" value={26} color="theme-red" />
      </View>
      <View className="gap-2">
        <HorizontalStatBar title="Match Win %" value={63.4} />
      </View>
      <View className="my-8 h-[1px] w-full bg-theme-gray-5"></View>
      <View>
        <HorizontalStatBar
          title="Win Streak"
          type="number"
          target={10}
          value={0}
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
