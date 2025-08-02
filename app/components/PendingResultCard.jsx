import { StyleSheet, Text, View, Pressable } from 'react-native';
import TeamLogo from './TeamLogo';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import { useRouter } from 'expo-router';

const PendingResultCard = ({ fixture }) => {
  const router = useRouter();
  const { data: results, isLoading } = useResultsByFixture(fixture?.id);
  const homeScore =
    results?.filter((result) => result.home_player.id === result.winner_id).length || 0;
  const awayScore =
    results?.filter((result) => result.away_player.id === result.winner_id).length || 0;
  const homeWinner = homeScore > awayScore;
  const awayWinner = awayScore > homeScore;
  return (
    <Pressable onPress={() => router.push(`home/${fixture?.id}/approve-results`)}>
      <View className="items-center justify-between gap-8 border-b border-separator bg-bg-grouped-2 px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
        <View className="w-full flex-1 flex-row items-center justify-between">
          <Text className="font-saira-medium text-2xl text-text-1">Pending Result</Text>
          <Text className="w-fit rounded-full bg-theme-yellow/75 px-3 py-1 text-center font-saira-medium text-black">
            Awaiting Approval
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
              className={` ${homeWinner ? 'font-semibold' : ''} flex-1 text-left font-saira text-xl text-text-1`}>
              {fixture?.home_team?.display_name || 'Home Team'}
            </Text>
            <Text
              className={`${homeWinner ? 'font-semibold' : ''} w-12 text-center font-saira text-xl text-text-1`}>
              {homeScore}
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
              className={` ${awayWinner ? 'font-semibold' : ''} flex-1 text-left font-saira text-xl text-text-1`}>
              {fixture?.away_team?.display_name || 'Away Team'}
            </Text>
            <Text
              className={`${awayWinner ? 'font-semibold' : ''} w-12 text-center font-saira text-xl text-text-1`}>
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
