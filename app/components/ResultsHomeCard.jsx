import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ioconicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import colors from '@lib/colors';

const ResultsHomeCard = () => {
  const results = false; // Placeholder for results data, replace with actual data fetching logic
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme];
  return (
    <Pressable
      onPress={() => router.push('/home/results')}
      className="bg-bg-2 h-28 w-full rounded-xl">
      <View className="border-separator mx-3 flex-row items-center justify-between border-b px-1 py-2">
        <Text className="text-text-1 text-2xl font-semibold">Results</Text>
        <Ioconicons name="chevron-forward" size={24} color={themeColors.icon} />
      </View>
      {!results ? (
        <View className="items-left flex-1 justify-center px-4">
          <Text className="text-text-2 text-left text-xl">{`No results available yet.`}</Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          {/* Placeholder for results list, replace with actual results rendering logic */}
          <Text className="text-text-1 text-xl">Results will be displayed here</Text>
        </View>
      )}
    </Pressable>
  );
};

export default ResultsHomeCard;

const styles = StyleSheet.create({});
