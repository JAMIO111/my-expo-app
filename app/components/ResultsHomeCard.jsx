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
      className="h-28 w-full rounded-xl bg-bg-2">
      <View className="mx-3 flex-row items-center justify-between border-b border-separator px-1 py-2">
        <Text className="text-2xl font-semibold text-text-1">Results</Text>
        <Ioconicons name="chevron-forward" size={24} color={themeColors.icon} />
      </View>
      {!results ? (
        <View className="items-left flex-1 justify-center px-4">
          <Text className="text-left text-lg text-text-2">No results available yet.</Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          {/* Placeholder for results list, replace with actual results rendering logic */}
          <Text className="text-left text-lg text-text-2">Results will be displayed here</Text>
        </View>
      )}
    </Pressable>
  );
};

export default ResultsHomeCard;

const styles = StyleSheet.create({});
