import { StyleSheet, Text, View } from 'react-native';
import { usePlayerStats } from '@hooks/usePlayerStats';
import { useTeamStats } from '@hooks/useTeamStats';
import DonutChart from './DonutChart';

const EntityStats = ({ entityId, entityType }) => {
  console.log('PlayerStats Component Rendered with entityId:', entityId);
  const { data: playerData, error: playerError } = usePlayerStats(
    entityType === 'player' ? entityId : null
  );
  const { data: teamData, error: teamError } = useTeamStats(
    entityType === 'team' ? entityId : null
  );

  const data = entityType === 'team' ? teamData : playerData;
  const error = entityType === 'team' ? teamError : playerError;

  if (error) {
    console.error('Error fetching stats:', error);
  } else {
    console.log('Stats Data:', data);
  }

  const StatSection = ({ title, stats, type }) => {
    const prefix = type; // "frames" or "matches"

    const won = stats?.[`${prefix}_won`] ?? 0;
    const drawn = stats?.[`${prefix}_drawn`] ?? 0;
    const lost = stats?.[`${prefix}_lost`] ?? 0;
    const winPercent = stats?.[`${prefix.slice(0, -1)}_win_percent`] ?? 0;
    const bestStreak = stats?.[`best_${prefix.slice(0, -1)}_streak`] ?? 0;
    const currentStreak = stats?.[`current_${prefix.slice(0, -1)}_streak`] ?? 0;

    return (
      <View className="bg-bg-grouped-2 px-6 py-8">
        <Text className="mb-2 font-saira-semibold text-3xl text-text-1">{title}</Text>

        <View className="mb-8 w-full flex-row items-center justify-between gap-8">
          <View className="gap-3 rounded-full border border-theme-gray-5 bg-bg-2 p-2 shadow-sm">
            <DonutChart wins={won} draws={drawn} losses={lost} statTitle={`${title} Played`} />
          </View>

          <View className="flex-1 gap-3 rounded-2xl border border-theme-gray-5 bg-bg-2 px-4 py-3 shadow-sm">
            <StatRow label="Won" value={won} color="bg-green-700" />
            <Divider />
            <StatRow label="Drawn" value={drawn} color="bg-yellow-500" />
            <Divider />
            <StatRow label="Lost" value={lost} color="bg-red-500" />
          </View>
        </View>

        <View className="mt-2 flex flex-row gap-8 rounded-2xl border border-theme-gray-5 bg-bg-2 px-2 py-6 shadow-sm">
          <StatBlock label="Win Rate" value={`${winPercent}%`} />
          <StatBlock label="Best Win Streak" value={bestStreak} />
          <StatBlock
            label="Current Win Streak"
            value={
              currentStreak > 0 && currentStreak === bestStreak
                ? `${currentStreak} 🔥`
                : currentStreak
            }
          />
        </View>
      </View>
    );
  };

  const StatRow = ({ label, value, color }) => (
    <View className="flex flex-row items-center gap-2">
      <View className={`h-3 w-3 rounded-full ${color}`} />
      <Text className="flex-1 font-saira-medium text-xl text-text-2">{label}</Text>
      <Text className="pr-4 font-saira-semibold text-2xl text-text-1">{value}</Text>
    </View>
  );

  const StatBlock = ({ label, value }) => (
    <View className="flex-1 items-center justify-center">
      <Text className="flex-1 font-saira-semibold text-3xl text-text-1">{value}</Text>
      <Text
        style={{ lineHeight: 18 }}
        className="flex-1 text-center text-lg font-semibold text-text-2">
        {label}
      </Text>
    </View>
  );

  const Divider = () => <View className="border-b border-theme-gray-5" />;

  return (
    <View className="w-full gap-1">
      <StatSection title="Frames" stats={data?.totalStats} type="frames" />

      <StatSection title="Matches" stats={data?.totalStats} type="matches" />
    </View>
  );
};

export default EntityStats;

const styles = StyleSheet.create({});
