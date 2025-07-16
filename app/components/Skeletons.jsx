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
