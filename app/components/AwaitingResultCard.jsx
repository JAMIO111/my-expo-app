import { StyleSheet, Text, View, Pressable } from 'react-native';
import TeamLogo from './TeamLogo';
import { useRouter } from 'expo-router';

const PendingResultCard = ({ fixture }) => {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/home/${fixture.id}/submit-results`)}>
      <View className="items-center justify-between gap-8 border-b border-separator bg-bg-grouped-2 px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
        <View className="w-full flex-1 flex-row items-center justify-between">
          <Text className="font-saira-semibold text-2xl text-text-1">Submit Result</Text>
          <Text className="w-fit rounded-full bg-theme-teal px-3 py-1 text-center font-saira-medium text-black">
            Awaiting Submission
          </Text>
        </View>
        <View className="flex-1 items-center justify-between gap-2">
          <View className="flex-1 flex-row justify-between gap-3">
            <TeamLogo
              size={20}
              type={fixture?.home_team?.crest?.type}
              color1={fixture?.home_team?.crest?.color1}
              color2={fixture?.home_team?.crest?.color2}
              thickness={fixture?.home_team?.crest?.thickness}
            />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className="flex-1 text-left font-saira text-xl text-text-1">
              {fixture?.home_team?.display_name || 'Home Team'}
            </Text>
            <Text className="text-center font-saira-medium text-xl text-text-1">
              {new Date(fixture.date_time).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
          <View className="flex-1 flex-row items-center justify-between gap-3">
            <TeamLogo
              size={20}
              type={fixture?.away_team?.crest?.type}
              color1={fixture?.away_team?.crest?.color1}
              color2={fixture?.away_team?.crest?.color2}
              thickness={fixture?.away_team?.crest?.thickness}
            />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className="flex-1 text-left font-saira text-xl text-text-1">
              {fixture?.away_team?.display_name || 'Away Team'}
            </Text>
            <Text className="text-center font-saira-medium text-xl text-text-1">
              {' '}
              {new Date(fixture.date_time).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default PendingResultCard;

const styles = StyleSheet.create({});
