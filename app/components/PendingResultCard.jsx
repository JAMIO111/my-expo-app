import { StyleSheet, Text, View, Pressable, ActivityIndicatorBase } from 'react-native';
import TeamLogo from './TeamLogo';
import Avatar from './Avatar';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import { useRouter } from 'expo-router';

const PendingResultCard = ({ fixture }) => {
  const router = useRouter();
  const { data: results, isLoading } = useResultsByFixture(fixture?.id);
  const homeScore = results?.filter((result) => result.winner_side === 'home').length || 0;
  const awayScore = results?.filter((result) => result.winner_side === 'away').length || 0;
  const homeWinner = homeScore > awayScore;
  const awayWinner = awayScore > homeScore;
  return (
    <Pressable onPress={() => router.push(`home/${fixture?.id}/approve-results`)}>
      <View className="items-center justify-between gap-5 border-b border-separator bg-bg-grouped-2 px-4 py-4 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
        <View className="w-full flex-1 flex-row items-center justify-between">
          <View className="flex-col">
            <Text className="font-saira-medium text-2xl text-text-1">Pending Result</Text>
            <Text className="text-md text-text-2">
              {fixture?.competition_instance?.name} Fixture
            </Text>
          </View>
          <Text className="w-fit rounded-full border border-theme-yellow bg-theme-yellow/70 px-3 py-1 text-center font-saira-medium text-black">
            Awaiting Approval
          </Text>
        </View>
        <View className="flex-1 items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center justify-between gap-2">
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
                ? fixture?.home_team?.abbreviation || 'Home Team'
                : `(${fixture?.home_player?.nickname})` || 'Home Player'}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className={` ${homeWinner ? 'font-semibold' : ''} flex-1 text-left font-saira text-xl text-text-2`}>
              {fixture?.competitor_type === 'team'
                ? fixture?.home_team?.display_name || 'Home Team'
                : `${fixture?.home_player?.first_name || 'Home'} ${fixture?.home_player?.surname || 'Player'}`}
            </Text>
            <Text
              className={`${homeWinner ? 'font-semibold' : ''} w-12 text-center font-saira text-2xl text-text-1`}>
              {homeScore}
            </Text>
          </View>
          <View className="flex-1 flex-row items-center justify-between gap-2">
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
                ? fixture?.away_team?.abbreviation || 'Away Team'
                : `(${fixture?.away_player?.nickname})` || 'Away Player'}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className={` ${awayWinner ? 'font-semibold' : ''} flex-1 text-left font-saira text-xl text-text-2`}>
              {fixture?.competitor_type === 'team'
                ? fixture?.away_team?.display_name || 'Away Team'
                : `${fixture?.away_player?.first_name || 'Away'} ${fixture?.away_player?.surname || 'Player'}`}
            </Text>
            <Text
              className={`${awayWinner ? 'font-semibold' : ''} w-12 text-center font-saira text-2xl text-text-1`}>
              {awayScore}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default PendingResultCard;

const styles = StyleSheet.create({});
