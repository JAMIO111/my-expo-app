import { View } from 'react-native';

export const FixtureSkeleton = () => {
  return (
    <View className="mb-4 items-center justify-center gap-3 rounded-2xl bg-brand py-3">
      <View className="flex-row items-center justify-center gap-5 px-24">
        <View className="h-3 flex-1 rounded-full bg-brand-light" />
        <View className="h-5 w-5 rounded-full bg-brand-light" />
        <View className="h-3 w-10 rounded-full bg-brand-light" />
        <View className="h-5 w-5 rounded-full bg-brand-light" />
        <View className="h-3 flex-1 rounded-full bg-brand-light" />
      </View>
      <View className="flex-row items-center justify-center gap-5 px-12">
        <View className="h-3 flex-1 rounded-full bg-brand-light" />
        <View className="h-3 flex-1 rounded-full bg-brand-light" />
      </View>
    </View>
  );
};

export const TableSkeleton = () => {
  return (
    <View className="mt-4 w-full flex-1 items-center p-2">
      <View className="mb-16 w-full rounded-2xl bg-brand p-3">
        <View className="h-12 flex-row items-center justify-around gap-2 border-b-[0.5px] border-brand-light">
          <View className="h-4 w-10 rounded-full bg-brand-light" />
          <View className="h-4 flex-1 rounded-full bg-brand-light pl-3" />
          <View className="h-4 w-8 rounded-full bg-brand-light" />
          <View className="h-4 w-8 rounded-full bg-brand-light" />
          <View className="h-4 w-8 rounded-full bg-brand-light" />
          <View className="h-4 w-9 rounded-full bg-brand-light" />
          <View className="h-4 w-8 rounded-full bg-brand-light" />
        </View>
        {/* Repeat for each team row */}
        {[...Array(16)].map((_, index) => (
          <View key={index} className="flex-row items-center justify-around gap-2 py-3">
            <View className="h-4 w-10 rounded-full bg-brand-light" />
            <View className="h-4 flex-1 rounded-full bg-brand-light pl-3" />
            <View className="h-4 w-8 rounded-full bg-brand-light" />
            <View className="h-4 w-8 rounded-full bg-brand-light" />
            <View className="h-4 w-8 rounded-full bg-brand-light" />
            <View className="h-4 w-9 rounded-full bg-brand-light" />
            <View className="h-4 w-8 rounded-full bg-brand-light" />
          </View>
        ))}
      </View>
    </View>
  );
};
