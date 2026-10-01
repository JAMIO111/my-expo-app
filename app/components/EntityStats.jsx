import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import DonutChart from './DonutChart';
import { Zap, Undo2, ArrowUpDown } from 'lucide-react-native';
import StatsFilterBar from './StatsFilterBar';
import StatsFilterSheet, { FRAME_TYPE_OPTIONS, VENUE_OPTIONS } from './StatsFilterSheet';
import { useRevenueCat } from '@contexts/RevenueCatProvider';
import { useUpgradeSheet } from '@contexts/UpgradeSheetProvider';
import {
  EMPTY_STATS_FILTERS,
  countActiveFilters,
  useEntityFilterOptions,
  useEntityStats,
} from '@hooks/useEntityStats';

const EntityStats = ({ entityId, entityType }) => {
  const router = useRouter();
  const { isPro, isCore } = useRevenueCat();
  const { openUpgradeSheet } = useUpgradeSheet();

  // Everyone sees the basic (unfiltered) stats. The filters are visible to all
  // but only Core and Pro members can apply them.
  const canFilter = isPro || isCore;

  const [filters, setFilters] = useState(EMPTY_STATS_FILTERS);
  const [filtersOpened, setFiltersOpened] = useState(false);
  const sheetRef = useRef(null);

  // A lapsed subscription falls straight back to the unfiltered view.
  const activeFilters = canFilter ? filters : EMPTY_STATS_FILTERS;
  const hasFilters = countActiveFilters(activeFilters) > 0;

  const statsQuery = useEntityStats(entityType, entityId, activeFilters);
  const optionsQuery = useEntityFilterOptions(entityType, entityId, {
    enabled: filtersOpened,
  });

  const data = statsQuery.data;
  const isStatsLoading = statsQuery.isFetching;
  const seasonOptions = optionsQuery.data?.seasons ?? [];
  const competitionOptions = optionsQuery.data?.competitions ?? [];

  const activeChips = useMemo(() => {
    const nameOf = (list, id) => list.find((item) => item.id === id)?.name ?? 'Unknown';
    const chips = [];
    activeFilters.seasonIds.forEach((id) =>
      chips.push({
        key: `season-${id}`,
        label: nameOf(seasonOptions, id),
        onRemove: () =>
          setFilters((f) => ({ ...f, seasonIds: f.seasonIds.filter((x) => x !== id) })),
      })
    );
    activeFilters.competitionIds.forEach((id) =>
      chips.push({
        key: `competition-${id}`,
        label: nameOf(competitionOptions, id),
        onRemove: () =>
          setFilters((f) => ({ ...f, competitionIds: f.competitionIds.filter((x) => x !== id) })),
      })
    );
    if (activeFilters.frameType)
      chips.push({
        key: 'frameType',
        label: FRAME_TYPE_OPTIONS.find((o) => o.value === activeFilters.frameType)?.label,
        onRemove: () => setFilters((f) => ({ ...f, frameType: null })),
      });
    if (activeFilters.venue)
      chips.push({
        key: 'venue',
        label: `${VENUE_OPTIONS.find((o) => o.value === activeFilters.venue)?.label} venue`,
        onRemove: () => setFilters((f) => ({ ...f, venue: null })),
      });
    return chips;
  }, [activeFilters, seasonOptions, competitionOptions]);

  // Everyone can open the filter sheet (free users get a taste); only Core and
  // Pro can apply, which is gated inside the sheet.
  const openFilters = () => {
    setFiltersOpened(true);
    sheetRef.current?.present();
  };

  const promptUpgrade = () =>
    openUpgradeSheet({
      title: 'Stat Filters',
      planName: 'Core',
      description:
        'Apply filters to see your stats by season, competition, frame type and venue with a Core or Pro plan.',
      onUpgrade: () => {
        sheetRef.current?.dismiss();
        router.push('/(main)/home/paywall');
      },
    });

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
      <View className="gap-3">
        <View className="flex-col items-center rounded-3xl  bg-bg-3 p-3">
          <Text className="w-full flex-1 px-2 pt-2 text-left font-saira-medium text-3xl text-text-1">
            {title}
          </Text>
          <View className="flex-row gap-10 rounded-3xl p-4">
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
          <View style={{ borderRadius: 24 }} className="flex-1 bg-bg-3">
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
          <View style={{ borderRadius: 24 }} className="flex-1 bg-bg-3">
            <StatBlock label="Frame Win Streak" subLabel="Career Best" value={bestStreak} />
          </View>
        </View>
      </View>
    );
  };

  const noMatches =
    hasFilters && !isStatsLoading && !statsQuery.isError && data?.totalStats?.frames_played === 0;

  return (
    <View className="w-full gap-3 p-3 pb-24">
      <StatsFilterBar
        activeChips={activeChips}
        onOpen={openFilters}
        onClearAll={() => setFilters(EMPTY_STATS_FILTERS)}
      />
      <StatsFilterSheet
        ref={sheetRef}
        seasons={seasonOptions}
        competitions={competitionOptions}
        isLoadingOptions={optionsQuery.isLoading}
        optionsError={optionsQuery.isError}
        value={filters}
        onApply={setFilters}
        locked={!canFilter}
        onLockedApply={promptUpgrade}
      />
      {statsQuery.isError && (
        <Pressable
          onPress={() => statsQuery.refetch()}
          className="flex-row items-center justify-between rounded-2xl bg-theme-red/15 px-4 py-3">
          <Text className="flex-1 font-saira-medium text-base text-theme-red">
            Couldn't load these stats. Tap to retry.
          </Text>
        </Pressable>
      )}
      {noMatches && (
        <Text className="px-2 text-center font-saira-medium text-base text-text-2">
          No frames match these filters.
        </Text>
      )}
      <View className="gap-3" style={{ opacity: isStatsLoading ? 0.5 : 1 }}>
        <StatSection title="Frames" stats={data?.totalStats} type="frames" />
        <View className="gap-3">
          <View className="flex-row items-center gap-8 rounded-3xl bg-bg-3 px-3 py-3">
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
          <View className="flex-row items-center gap-8 rounded-3xl bg-bg-3 px-3 py-3">
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
          <View className="flex-row items-center gap-8 rounded-3xl bg-bg-3 px-3 py-3">
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
    </View>
  );
};

export default EntityStats;

const styles = StyleSheet.create({});
