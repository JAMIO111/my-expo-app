import { View, ActivityIndicator, Text } from 'react-native';

export const FixtureSkeleton = () => {
  return (
    <View className="mb-4 items-center justify-center gap-3 rounded-2xl bg-bg-grouped-2 py-3">
      <View className="flex-row items-center justify-center gap-5 px-24">
        <View className="h-3 flex-1 rounded-full bg-theme-gray-5" />
        <View className="h-5 w-5 rounded-full bg-theme-gray-5" />
        <View className="h-3 w-10 rounded-full bg-theme-gray-5" />
        <View className="h-5 w-5 rounded-full bg-theme-gray-5" />
        <View className="h-3 flex-1 rounded-full bg-theme-gray-5" />
      </View>
      <View className="flex-row items-center justify-center gap-5 px-12">
        <View className="h-3 flex-1 rounded-full bg-theme-gray-5" />
        <View className="h-3 flex-1 rounded-full bg-theme-gray-5" />
      </View>
    </View>
  );
};

export const FixtureDetailsSkeleton = ({ fixtureDetails }) => {
  return (
    <View className="bg-bg-grouped-1">
      <View
        style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
        className="bg-brand p-3 pb-5">
        <View className="rounded-3xl bg-bg-grouped-2 p-5">
          <View className="mb-3 flex-row items-center justify-around">
            <View className="h-14 w-12 rounded-lg bg-theme-gray-5"></View>
            <View className="h-14 w-12 rounded-lg bg-theme-gray-5"></View>
            <View className="h-14 w-12 rounded-lg bg-theme-gray-5"></View>
            <View className="h-14 w-12 rounded-lg bg-theme-gray-5"></View>
          </View>
          <View className="relative mb-2 flex-row items-start justify-center p-3">
            <View className="absolute left-0 z-50">
              <View style={{ width: 60, height: 60 }} className="rounded-full bg-bg-3"></View>
            </View>
            <View className="h-10 flex-1 items-center justify-center bg-bg-3 py-0.5"></View>
            <View className="h-14 w-24 rounded-b-2xl border-x-2 border-bg-2 bg-bg-3"></View>
            <View className="absolute right-0 z-50">
              <View style={{ width: 60, height: 60 }} className="rounded-full bg-bg-3"></View>
            </View>
            <View className="h-10 flex-1 items-center justify-center bg-bg-3 py-0.5"></View>
          </View>
          <View className="w-full flex-row items-center gap-2 pb-2">
            <View className="h-6 flex-1 rounded-full bg-bg-3"></View>
            <Text className="w-6 text-text-2"> vs </Text>
            <View className="h-6 flex-1 rounded-full bg-bg-3"></View>
          </View>
          <View className="border-t border-theme-gray-4 py-2"></View>
          <View className="w-full gap-3">
            <View className="h-6 w-full rounded-full bg-bg-3"></View>
            <View className="h-6 w-full rounded-full bg-bg-3"></View>
            <View className="h-6 w-full rounded-full bg-bg-3"></View>
          </View>
        </View>
      </View>
    </View>
  );
};

export const TableSkeleton = () => {
  return (
    <View className="w-full flex-1 items-start gap-3 bg-bg-grouped-1 p-2">
      <View className="w-full flex-row items-center justify-between px-2 pt-3">
        <View className="h-5 w-1/2 rounded-full bg-theme-gray-5" />
        <ActivityIndicator size="small" color="gray" />
      </View>
      <View className="mb-24 w-full rounded-2xl border border-separator-faint bg-bg-grouped-2 p-3">
        <View className="h-12 flex-row items-center justify-around gap-2 border-b-[0.5px] border-separator">
          <View className="h-4 w-10 rounded-full bg-theme-gray-5" />
          <View className="shimmer h-4 flex-1 rounded-full bg-theme-gray-5 pl-3" />
          <View className="h-4 w-8 rounded-full bg-theme-gray-5" />
          <View className="h-4 w-8 rounded-full bg-theme-gray-5" />
          <View className="h-4 w-8 rounded-full bg-theme-gray-5" />
          <View className="h-4 w-9 rounded-full bg-theme-gray-5" />
          <View className="h-4 w-8 rounded-full bg-theme-gray-5" />
        </View>
        {/* Repeat for each team row */}
        {[...Array(16)].map((_, index) => (
          <View key={index} className="flex-row items-center justify-around gap-2 py-4">
            <View className="h-4 w-10 rounded-full bg-theme-gray-5" />
            <View className="h-4 flex-1 rounded-full bg-theme-gray-5 pl-3" />
            <View className="h-4 w-8 rounded-full bg-theme-gray-5" />
            <View className="h-4 w-8 rounded-full bg-theme-gray-5" />
            <View className="h-4 w-8 rounded-full bg-theme-gray-5" />
            <View className="h-4 w-9 rounded-full bg-theme-gray-5" />
            <View className="h-4 w-8 rounded-full bg-theme-gray-5" />
          </View>
        ))}
      </View>
    </View>
  );
};

export const LeaderboardSkeleton = () => {
  return (
    <View className="h-[300px] w-[300px] flex-1 items-start gap-3 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-2">
      <View className="m-2 h-8 w-1/2 rounded-full bg-theme-gray-5" />
      <View className="w-full flex-1 items-center justify-around px-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} className="w-full flex-row gap-5">
            <View className="h-8 flex-1 rounded-full bg-theme-gray-5" />
            <View className="h-8 w-12 rounded-full bg-theme-gray-5" />
          </View>
        ))}
      </View>
    </View>
  );
};

export const UpcomingFixtureSkeleton = () => {
  return (
    <View className="w-full flex-1 items-center justify-center gap-3 rounded-2xl bg-bg-grouped-2 p-5">
      <View className="h-4 w-full rounded-full bg-theme-gray-4" />
      <View className="h-4 w-8 rounded-full bg-theme-gray-4" />
      <View className="h-4 w-full rounded-full bg-theme-gray-4" />
      <View className="w-full px-6">
        <View className="mt-2 h-3 w-full rounded-full bg-theme-gray-4" />
      </View>
    </View>
  );
};
