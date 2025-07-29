import { View, ActivityIndicator } from 'react-native';

export const FixtureSkeleton = () => {
  return (
    <View className="mb-4 items-center justify-center gap-3 rounded-2xl bg-bg-grouped-2 py-3">
      <View className="flex-row items-center justify-center gap-5 px-24">
        <View className="h-3 flex-1 rounded-full bg-bg-grouped-3" />
        <View className="h-5 w-5 rounded-full bg-bg-grouped-3" />
        <View className="h-3 w-10 rounded-full bg-bg-grouped-3" />
        <View className="h-5 w-5 rounded-full bg-bg-grouped-3" />
        <View className="h-3 flex-1 rounded-full bg-bg-grouped-3" />
      </View>
      <View className="flex-row items-center justify-center gap-5 px-12">
        <View className="h-3 flex-1 rounded-full bg-bg-grouped-3" />
        <View className="h-3 flex-1 rounded-full bg-bg-grouped-3" />
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
          <View className="h-4 w-10 rounded-full bg-bg-grouped-3" />
          <View className="shimmer h-4 flex-1 rounded-full bg-bg-grouped-3 pl-3" />
          <View className="h-4 w-8 rounded-full bg-bg-grouped-3" />
          <View className="h-4 w-8 rounded-full bg-bg-grouped-3" />
          <View className="h-4 w-8 rounded-full bg-bg-grouped-3" />
          <View className="h-4 w-9 rounded-full bg-bg-grouped-3" />
          <View className="h-4 w-8 rounded-full bg-bg-grouped-3" />
        </View>
        {/* Repeat for each team row */}
        {[...Array(16)].map((_, index) => (
          <View key={index} className="flex-row items-center justify-around gap-2 py-4">
            <View className="h-4 w-10 rounded-full bg-bg-grouped-3" />
            <View className="h-4 flex-1 rounded-full bg-bg-grouped-3 pl-3" />
            <View className="h-4 w-8 rounded-full bg-bg-grouped-3" />
            <View className="h-4 w-8 rounded-full bg-bg-grouped-3" />
            <View className="h-4 w-8 rounded-full bg-bg-grouped-3" />
            <View className="h-4 w-9 rounded-full bg-bg-grouped-3" />
            <View className="h-4 w-8 rounded-full bg-bg-grouped-3" />
          </View>
        ))}
      </View>
    </View>
  );
};
