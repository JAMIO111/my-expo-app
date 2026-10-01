import { StyleSheet, Text, View, Pressable } from 'react-native';
import TeamLogo from './TeamLogo';
import Avatar from './Avatar';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import { useRouter } from 'expo-router';
import { Swords } from 'lucide-react-native';
import { useTheme } from '@contexts/ThemeProvider';

const ESCALATION_REASONS = {
  manual: 'Escalated by a captain',
  no_result_submitted: 'No result submitted in time',
  no_response_to_result: 'Result not approved or disputed in time',
  no_amendment: 'Dispute not answered in time',
  no_response_to_amendment: 'Amendment not answered in time',
  forfeit_not_approved: 'Forfeit not approved in time',
  forfeit_disputed: 'Forfeit disputed',
};

// mode: undefined = a captain's pending item; 'escalated' = an admin's escalated fixture.
const PendingResultCard = ({ fixture, mode }) => {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { data: results, isLoading } = useResultsByFixture(fixture?.id);
  const isForfeitPending = !!fixture?.is_forfeited && !fixture?.approved;
  const isEscalatedView = mode === 'escalated';
  const homeScore = isForfeitPending
    ? (fixture?.home_score ?? 0)
    : results?.filter((result) => result.winner_side === 'home').length || 0;
  const awayScore = isForfeitPending
    ? (fixture?.away_score ?? 0)
    : results?.filter((result) => result.winner_side === 'away').length || 0;
  const homeWinner = homeScore > awayScore;
  const awayWinner = awayScore > homeScore;
  const target = isEscalatedView
    ? `/home/${fixture?.id}/submit-results`
    : isForfeitPending
      ? `home/${fixture?.id}/approve-results`
      : fixture?.is_amended
        ? `home/${fixture?.id}/approve-results`
        : fixture?.is_disputed
          ? `home/${fixture?.id}/submit-results`
          : `home/${fixture?.id}/approve-results`;
  const tag = isEscalatedView
    ? { text: 'Escalated', style: 'border-theme-red bg-theme-red/20 text-theme-red' }
    : isForfeitPending
      ? { text: 'Forfeit Requested', style: 'border-theme-red bg-theme-red/20 text-theme-red' }
      : fixture?.is_amended
        ? { text: 'Amended Result', style: 'border-theme-orange bg-theme-orange/20 text-theme-orange' }
        : fixture?.is_disputed
          ? { text: 'Disputed Result', style: 'border-theme-red bg-theme-red/20 text-theme-red' }
          : {
              text: 'Approve Result',
              style: 'border-theme-purple bg-theme-purple/20 text-theme-purple',
            };
  return (
    <Pressable onPress={() => router.push(target)}>
      <View
        style={{ borderWidth: 0.5 }}
        className="relative items-center justify-between gap-5 rounded-2xl border border-theme-gray-4 bg-bg-3 px-4 py-4">
        <View className="w-full flex-1 flex-row items-center justify-between">
          <View className="flex-col">
            <Text className="font-saira-medium text-lg text-text-1">
              {`${new Date(fixture.date_time).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: '2-digit',
              })} | ${new Date(fixture.date_time).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}`}
            </Text>
            <View className="flex-row items-center gap-2">
              <Swords size={14} color={themeColors.icon} />
              <Text className="text-md font-saira text-text-1">
                {fixture?.competition_instance?.name} Fixture
              </Text>
            </View>
            {isEscalatedView && fixture?.escalation_reason ? (
              <Text className="font-saira text-sm text-theme-red">
                {ESCALATION_REASONS[fixture.escalation_reason] ?? 'Escalated'}
              </Text>
            ) : null}
          </View>
          <Text
            className={`absolute right-0 top-0 w-fit rounded-xl border ${tag.style} px-3 py-1 text-center font-saira-medium text-black`}>
            {tag.text}
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
              {isLoading ? '...' : homeScore}
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
              {isLoading ? '...' : awayScore}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default PendingResultCard;

const styles = StyleSheet.create({});
