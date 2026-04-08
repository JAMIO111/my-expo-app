import { StyleSheet, Text, View, Pressable } from 'react-native';
import TeamLogo from './TeamLogo';
import Avatar from './Avatar';
import { useRouter } from 'expo-router';

const PendingResultCard = ({ fixture }) => {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/home/${fixture.id}/submit-results`)}>
      <View className="relative items-center justify-between gap-5 border-b border-separator bg-bg-grouped-2 px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
        <View className="w-full flex-1 flex-row items-center justify-between">
          <View className="flex-col">
            <Text className="font-saira-medium text-2xl text-text-1">Submit Result</Text>
            <Text className="text-md font-saira text-text-2">
              {fixture?.competition_instance?.name} Fixture
            </Text>
          </View>
          <Text className="absolute right-0 top-0 w-fit rounded-xl border border-theme-teal bg-theme-teal/20 px-3 py-1 text-center font-saira-medium text-theme-teal">
            Awaiting Submission
          </Text>
        </View>
        <View className="flex-1 items-center justify-between gap-2">
          <View className="flex-1 flex-row justify-between gap-3">
            {fixture?.competitor_type === 'team' ? (
              <TeamLogo
                size={26}
                type={fixture?.home_team?.crest?.type}
                color1={fixture?.home_team?.crest?.color1}
                color2={fixture?.home_team?.crest?.color2}
                thickness={fixture?.home_team?.crest?.thickness}
              />
            ) : (
              <Avatar size={26} borderRadius={13} player={fixture?.home_player} />
            )}
            <Text className="font-saira-semibold text-xl text-text-1">
              {fixture?.competitor_type === 'team'
                ? fixture?.home_team?.abbreviation
                : `(${fixture?.home_player?.nickname})` || 'Home Player'}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className="flex-1 text-left font-saira text-xl text-text-1">
              {fixture?.competitor_type === 'team'
                ? fixture?.home_team?.display_name
                : `${fixture?.home_player?.first_name} ${fixture?.home_player?.surname}`}
            </Text>
            <Text className="text-center font-saira-medium text-lg text-text-1">
              {new Date(fixture.date_time).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: '2-digit',
              })}
            </Text>
          </View>
          <View className="flex-1 flex-row items-center justify-between gap-3">
            {fixture?.competitor_type === 'team' ? (
              <TeamLogo
                size={26}
                type={fixture?.away_team?.crest?.type}
                color1={fixture?.away_team?.crest?.color1}
                color2={fixture?.away_team?.crest?.color2}
                thickness={fixture?.away_team?.crest?.thickness}
              />
            ) : (
              <Avatar size={26} borderRadius={13} player={fixture?.away_player} />
            )}
            <Text className="font-saira-semibold text-xl text-text-1">
              {fixture?.competitor_type === 'team'
                ? fixture?.away_team?.abbreviation
                : `(${fixture?.away_player?.nickname})` || 'Away Player'}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className="flex-1 text-left font-saira text-xl text-text-1">
              {fixture?.competitor_type === 'team'
                ? fixture?.away_team?.display_name
                : `${fixture?.away_player?.first_name} ${fixture?.away_player?.surname}`}
            </Text>
            <Text className="text-center font-saira-medium text-lg text-text-1">
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
