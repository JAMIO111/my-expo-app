import { StyleSheet, Text, View, Pressable } from 'react-native';
import TeamLogo from './TeamLogo';

const PendingResultCard = () => {
  return (
    <Pressable>
      <View className="items-center justify-between gap-8 border-b border-separator bg-bg-grouped-2 px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
        <View className="w-full flex-1 flex-row items-center justify-between">
          <Text className="font-saira-semibold text-2xl text-text-1">Submit Result</Text>
          <Text className="w-fit rounded-full bg-theme-teal px-3 py-1 text-center font-saira-medium text-black">
            Awaiting Submission
          </Text>
        </View>
        <View className="flex-1 items-center justify-between gap-2">
          <View className="flex-1 flex-row justify-between gap-3">
            <TeamLogo size={20} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className="flex-1 text-left font-saira text-xl text-text-1">
              Grapes A
            </Text>
            <Text className="text-center font-saira-medium text-lg text-text-1">Thu, 8 Sep 25</Text>
          </View>
          <View className="flex-1 flex-row items-center justify-between gap-3">
            <TeamLogo size={20} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className="flex-1 text-left font-saira text-xl text-text-1">
              South Beach B
            </Text>
            <Text className="text-center font-saira-medium text-xl text-text-1">18:00</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default PendingResultCard;

const styles = StyleSheet.create({});
