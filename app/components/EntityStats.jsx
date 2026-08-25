import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePlayerStats } from '@hooks/usePlayerStats';
import { useTeamStats } from '@hooks/useTeamStats';
import DonutChart from './DonutChart';
import { Zap, Undo2, ArrowUpDown } from 'lucide-react-native';
import ChipSelector from './ChipSelector';

const EntityStats = ({ entityId, entityType }) => {
  const [selectedType, setSelectedType] = useState(null); // null, 'singles', 'doubles'
  const [selectedLocation, setSelectedLocation] = useState(null); // null, 'home', 'away'
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

  const StatRow = ({ label, value, color }) => (
    <View className="flex flex-row items-center gap-3">
      <View className={`h-4 w-4 rounded-full ${color}`} />
      <Text className="flex-1 font-saira-medium text-xl text-text-2">{label}</Text>
      <Text className="pr-4 font-saira-semibold text-2xl text-text-1">{value}</Text>
    </View>
  );

  const StatBlock = ({ label, subLabel, value, icon }) => (
    <View className="relative flex-1 items-center justify-between px-5 py-3 pb-2">
      <View className="w-full flex-col items-start">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="font-saira-semibold text-xl text-text-1">
          {label}
        </Text>
        <Text className="font-saira-medium text-lg text-text-2">{subLabel}</Text>
      </View>

      <Text style={{ fontSize: 40 }} className="w-full text-left font-saira-semibold text-text-1">
        {value}
      </Text>
    </View>
  );

  const StatSection = ({ title, stats, type }) => {
    const prefix = type; // "frames" or "matches"

    const won = stats?.[`${prefix}_won`] ?? 0;
    const drawn = stats?.[`${prefix}_drawn`] ?? 0;
    const lost = stats?.[`${prefix}_lost`] ?? 0;
    const winPercent = stats?.[`${prefix.slice(0, -1)}_win_percent`] ?? 0;
    const bestStreak = stats?.[`best_${prefix.slice(0, -1)}_streak`] ?? 0;
    const currentStreak = stats?.[`current_${prefix.slice(0, -1)}_streak`] ?? 0;

    return (
      <View className="gap-3 bg-bg-grouped-1">
        <View className="flex-col items-center rounded-3xl border border-theme-gray-5 bg-bg-1 p-3">
          <Text className="w-full flex-1 px-2 pt-2 text-left font-saira-medium text-3xl text-text-1">
            {title}
          </Text>
          <View className="flex-row gap-10 rounded-3xl bg-bg-1 p-4">
            <DonutChart
              wins={won}
              draws={drawn}
              losses={lost}
              statValue={`${winPercent}%`}
              statTitle={`Win Rate`}
            />
            <View className="flex-1 justify-between">
              <StatRow label="Won" value={won} color="bg-green-700" />
              <StatRow label="Tied" value={drawn} color="bg-yellow-500" />
              <StatRow label="Lost" value={lost} color="bg-red-500" />
              <StatRow label="Played" value={won + drawn + lost} color="bg-blue-500" />
            </View>
          </View>
        </View>
        <View className="flex-row gap-3">
          <View style={{ borderRadius: 24 }} className="flex-1 border border-theme-gray-5 bg-bg-1">
            <StatBlock
              label="Frame Win Streak"
              subLabel="Current"
              icon={
                <View className="items-center justify-center">
                  <Zap size={40} color="#7e0fd9" />
                </View>
              }
              value={
                currentStreak > 0 && currentStreak === bestStreak
                  ? `🔥 ${currentStreak}`
                  : currentStreak
              }
            />
          </View>
          <View style={{ borderRadius: 24 }} className="flex-1 border border-theme-gray-5 bg-bg-1">
            <StatBlock label="Frame Win Streak" subLabel="Career Best" value={bestStreak} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="w-full gap-3 p-3 pb-24">
      <View>
        <ChipSelector
          options={[
            { label: 'All', value: null },
            { label: 'Singles', value: 'singles' },
            { label: 'Doubles', value: 'doubles' },
          ]}
          value={selectedType}
          onChange={(newType) => {
            setSelectedType(newType);
          }}
        />
        <ChipSelector
          options={[
            { label: 'All', value: null },
            { label: 'Home', value: 'home' },
            { label: 'Away', value: 'away' },
          ]}
          value={selectedLocation}
          onChange={(newLocation) => {
            setSelectedLocation(newLocation);
          }}
        />
      </View>
      <StatSection title="Frames" stats={data?.totalStats} type="frames" />
      <View className="gap-3">
        <View className="flex-row items-center gap-8 rounded-3xl border border-theme-gray-5 bg-bg-1 px-3 py-3">
          <View
            style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: '#7e0fd922' }}
            className="items-center justify-center">
            <ArrowUpDown size={40} color="#7e0fd9" />
          </View>
          <View className="flex-1">
            <Text className="font-saira-semibold text-xl text-text-1">Lags Won</Text>
            <Text className="font-saira-light text-xs text-text-2">
              Roll closest to the cushion to win the lag and choose who breaks first.
            </Text>
          </View>
          <Text
            style={{
              fontSize: 40,
              lineHeight: 60,
            }}
            className="px-3 font-saira-semibold text-text-1">
            {data?.totalStats?.lags_won ?? 0}
          </Text>
        </View>
        <View className="flex-row items-center gap-8 rounded-3xl border border-theme-gray-5 bg-bg-1 px-3 py-3">
          <View
            style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: '#d95c0f33' }}
            className="items-center justify-center">
            <Zap size={40} color="#d95c0f" />
          </View>

          <View className="flex-1">
            <Text className="font-saira-semibold text-xl text-text-1">Break Dishes</Text>
            <Text className="font-saira-light text-xs text-text-2">
              Win the frame off break without your opponent coming to the table
            </Text>
          </View>
          <Text
            style={{
              fontSize: 40,
              lineHeight: 60,
            }}
            className="px-3 font-saira-semibold text-text-1">
            {data?.totalStats?.break_dishes ?? 0}
          </Text>
        </View>
        <View className="flex-row items-center gap-8 rounded-3xl border border-theme-gray-5 bg-bg-1 px-3 py-3">
          <View
            style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: '#1e870e33' }}
            className="items-center justify-center">
            <Undo2 size={40} color="#1e870e" />
          </View>
          <View className="flex-1">
            <Text className="font-saira-semibold text-xl text-text-1">Reverse Dishes</Text>
            <Text className="font-saira-light text-xs text-text-2">
              Win the frame at your first visit after your opponent's dry break.
            </Text>
          </View>
          <Text
            style={{
              fontSize: 40,
              lineHeight: 60,
            }}
            className="px-3 font-saira-semibold text-text-1">
            {data?.totalStats?.reverse_dishes ?? 0}
          </Text>
        </View>
      </View>
      <StatSection title="Matches" stats={data?.totalStats} type="matches" />
    </View>
  );
};

export default EntityStats;

const styles = StyleSheet.create({});
