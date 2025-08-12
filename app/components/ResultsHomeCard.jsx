import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Ioconicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import colors from '@lib/colors';
import TeamLogo from './TeamLogo';

const ResultsHomeCard = ({ result }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  console.log('ResultsHomeCard result:', result);
  return (
    <Pressable
      onPress={() => router.push('/home/results')}
      className="w-full rounded-xl border border-theme-gray-5 bg-bg-grouped-2 shadow">
      <View className="mx-3 flex-row items-center justify-between border-b border-theme-gray-5 px-1 pb-1 pt-2">
        <Text className="font-saira-medium text-2xl text-text-1">Results</Text>
        <Ioconicons name="chevron-forward" size={20} color={themeColors?.icon} />
      </View>
      {!result ? (
        <View className="items-left flex-1 justify-center px-4 py-4">
          <Text className="text-left font-saira text-xl text-text-2">
            No results available yet.
          </Text>
        </View>
      ) : (
        <View
          className="flex-1 items-center 
        
        
        justify-center py-2">
          <View className="flex-row justify-between px-5">
            <View className="flex-1 flex-row items-center justify-start">
              <TeamLogo {...result?.homeTeam?.crest} size={20} />
              <Text className="mx-2 font-saira-semibold text-xl text-text-1">
                {result?.homeTeam?.abbreviation}
              </Text>
              <Text className="font-saira text-xl text-text-2">
                {result?.homeTeam?.display_name}
              </Text>
            </View>
            <Text className="font-saira-semibold text-2xl text-text-1">{result?.home_score}</Text>
          </View>
          <View className="flex-row justify-between px-5">
            <View className="flex-1 flex-row items-center justify-start">
              <TeamLogo {...result?.awayTeam?.crest} size={20} />
              <Text className="mx-2 font-saira-semibold text-xl text-text-1">
                {result?.awayTeam?.abbreviation}
              </Text>
              <Text className="font-saira text-xl text-text-2">
                {result?.awayTeam?.display_name}
              </Text>
            </View>
            <Text className="font-saira-semibold text-2xl text-text-1">{result?.away_score}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default ResultsHomeCard;

const styles = StyleSheet.create({});
