import { usePlayerFrames } from '@/hooks/usePlayerFrames';
import { FlatList, View, Text, Pressable } from 'react-native';
import Avatar from './Avatar';
import { useUser } from '@contexts/UserProvider';
import { ArrowUpDown, Undo2, Zap } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from './LoadingScreen';

const PlayerCard = ({ player, side }) => {
  return (
    <View
      className="items-center gap-3"
      style={{
        flexDirection: side === 'away' ? 'row-reverse' : 'row',
      }}>
      <Avatar size={36} borderRadius={8} player={player} />

      <Text className="font-saira-medium text-lg text-text-1">
        {player?.first_name} {player?.surname}
      </Text>
    </View>
  );
};

const ACHIEVEMENT_CONFIG = {
  'Lag Won': {
    icon: ArrowUpDown,
    color: '#3b82f6', // blue
    bgClass: 'bg-theme-blue/15',
    textClass: 'text-theme-blue',
  },
  'Break Dish': {
    icon: Zap,
    color: '#f97316', // orange
    bgClass: 'bg-theme-orange/15',
    textClass: 'text-theme-orange',
  },
  'Reverse Dish': {
    icon: Undo2,
    color: '#a855f7', // purple
    bgClass: 'bg-theme-purple/15',
    textClass: 'text-theme-purple',
  },
};

// Frames are shown for every fixture, not just approved ones; anything not yet
// approved gets a badge (fixture_status comes from get_player_frames).
const FIXTURE_STATUS_CONFIG = {
  pending: {
    label: 'Awaiting approval',
    bgClass: 'bg-theme-orange/15',
    textClass: 'text-theme-orange',
  },
  disputed: { label: 'Disputed', bgClass: 'bg-theme-red/15', textClass: 'text-theme-red' },
  escalated: {
    label: 'Escalated',
    bgClass: 'bg-theme-purple/15',
    textClass: 'text-theme-purple',
  },
  in_progress: {
    label: 'In progress',
    bgClass: 'bg-theme-blue/15',
    textClass: 'text-theme-blue',
  },
};

// Pinned to the card's top-right corner, straddling its top border like a tag.
// The solid outer view stops the border line showing through the tinted badge.
// Must be a direct child of the (relative-positioned) card.
const FixtureStatusBadge = ({ status }) => {
  const config = FIXTURE_STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <View style={{ bottom: 6, right: 6 }} className="absolute z-10 rounded-full bg-bg-grouped-2">
      <View className={`rounded-full px-2 py-0.5 ${config.bgClass}`}>
        <Text className={`font-saira-medium text-xs ${config.textClass}`}>{config.label}</Text>
      </View>
    </View>
  );
};

const AchievementCard = ({ player, labels }) => {
  return (
    <View className="my-1 gap-2 rounded-2xl border border-theme-gray-5 bg-bg-grouped-3 px-3 py-2">
      <View className="flex-row items-center gap-3">
        <Avatar size={28} borderRadius={8} player={player} />
        <Text
          className="flex-1 font-saira-medium text-base text-text-1"
          numberOfLines={1}
          ellipsizeMode="tail">
          {player?.first_name} {player?.surname}
        </Text>
        <View className="shrink-0 flex-row items-center justify-end gap-2">
          {labels.map((label, i) => {
            const config = ACHIEVEMENT_CONFIG[label];
            const Icon = config.icon;
            return (
              <View
                key={`${label}-${i}`}
                className={`flex-row items-center gap-1 rounded-full px-2 py-1 ${config.bgClass}`}>
                <Icon size={16} color={config.color} />
                <Text className={`font-saira-medium text-sm ${config.textClass}`}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export const FrameRow = ({ frame, playersById, player }) => {
  const homePlayer1 = playersById.get(frame.home_player_1);
  const awayPlayer1 = playersById.get(frame.away_player_1);
  const homePlayer2 = frame.home_player_2 ? playersById.get(frame.home_player_2) : null;
  const awayPlayer2 = frame.away_player_2 ? playersById.get(frame.away_player_2) : null;

  const mySide =
    frame.home_player_1 === player?.id || frame.home_player_2 === player?.id ? 'home' : 'away';
  const result =
    frame.winner_side === null ? 'Draw' : frame.winner_side === mySide ? 'Win' : 'Loss';

  const achievementsMap = new Map();
  const addAchievement = (id, label) => {
    if (!id) return;
    if (!achievementsMap.has(id)) achievementsMap.set(id, []);
    achievementsMap.get(id).push(label);
  };

  addAchievement(frame.lag_won, 'Lag Won');
  addAchievement(frame.break_dish_player_1, 'Break Dish');
  addAchievement(frame.break_dish_player_2, 'Break Dish');
  addAchievement(frame.reverse_dish_player_1, 'Reverse Dish');
  addAchievement(frame.reverse_dish_player_2, 'Reverse Dish');

  const achievementCards = Array.from(achievementsMap.entries()).map(([id, labels]) => ({
    player: playersById.get(id),
    labels,
  }));

  return (
    <View className="my-2 gap-2 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2">
      <FixtureStatusBadge status={frame.fixture_status} />
      <View
        style={{ borderTopRightRadius: 20, borderTopLeftRadius: 20 }}
        className="gap-2 px-3 pt-3">
        <View className="flex-row items-center justify-between gap-2 border-b border-theme-gray-5 pb-1">
          <Text className="p-1 font-saira-medium text-sm text-text-2">
            {frame?.competition_name ? `${frame.competition_name}` : 'Fixture'}{' '}
            {frame?.stage_name ? ` | ${frame.stage_name}` : ''}
          </Text>
          <Text className="p-1 font-saira-medium text-sm text-text-2">
            {new Date(frame?.fixture_date_time).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}{' '}
            | Frame {frame?.frame_number}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between gap-2 px-3 py-1">
        <PlayerCard player={homePlayer1} side="home" />
        <PlayerCard player={awayPlayer1} side="away" />
      </View>
      {frame.home_player_2 && frame.away_player_2 && (
        <View className="flex-row items-center justify-between gap-2 px-3 py-1">
          <PlayerCard player={homePlayer2} side="home" />
          <PlayerCard player={awayPlayer2} side="away" />
        </View>
      )}

      {achievementCards.length > 0 && (
        <>
          <View className="w-full border-b border-theme-gray-5" />
          <View className="gap-1 px-3 pb-1">
            <Text className="px-2 pt-1 font-saira-medium text-sm text-text-2">Achievements</Text>
            {achievementCards.map(({ player: achievementPlayer, labels }, i) => (
              <AchievementCard
                key={achievementPlayer?.id ?? i}
                player={achievementPlayer}
                labels={labels}
              />
            ))}
          </View>
        </>
      )}
      <View
        style={{ borderBottomRightRadius: 20, borderBottomLeftRadius: 20 }}
        className="w-full flex-row items-center justify-between gap-2 overflow-hidden">
        <Text
          className={`w-full py-1 text-center font-saira-semibold text-xl ${result === 'Win' ? 'bg-theme-green/20 text-theme-green' : result === 'Loss' ? 'bg-theme-red/20 text-theme-red' : 'bg-theme-blue/20 text-theme-blue'}`}>
          {result} {frame?.forfeited ? '(By Forfeit)' : ''}
        </Text>
      </View>
    </View>
  );
};

const RESULT_STYLES = {
  Win: { bar: 'bg-theme-green', pill: 'bg-theme-green/20 text-theme-green' },
  Loss: { bar: 'bg-theme-red', pill: 'bg-theme-red/20 text-theme-red' },
  Draw: { bar: 'bg-theme-blue', pill: 'bg-theme-blue/20 text-theme-blue' },
};

const fullName = (p) => (p ? `${p.first_name ?? ''} ${p.surname ?? ''}`.trim() : 'Unknown');

// Compact one-line summary of a frame, used for the "Recent Frames" preview
// on the profile page. FrameRow above is the full-detail version.
export const FramePreviewRow = ({ frame, playersById, player, onPress }) => {
  const isHome = frame.home_player_1 === player?.id || frame.home_player_2 === player?.id;
  const mySide = isHome ? 'home' : 'away';
  const result =
    frame.winner_side === null ? 'Draw' : frame.winner_side === mySide ? 'Win' : 'Loss';
  const styles = RESULT_STYLES[result];

  const mine = (
    isHome ? [frame.home_player_1, frame.home_player_2] : [frame.away_player_1, frame.away_player_2]
  ).filter(Boolean);
  const opponentIds = (
    isHome ? [frame.away_player_1, frame.away_player_2] : [frame.home_player_1, frame.home_player_2]
  ).filter(Boolean);
  const partner = mine.find((id) => id !== player?.id);
  const opponents = opponentIds.map((id) => playersById.get(id));

  const myAchievements = [];
  if (frame.lag_won === player?.id) myAchievements.push('Lag Won');
  if (frame.break_dish_player_1 === player?.id || frame.break_dish_player_2 === player?.id)
    myAchievements.push('Break Dish');
  if (frame.reverse_dish_player_1 === player?.id || frame.reverse_dish_player_2 === player?.id)
    myAchievements.push('Reverse Dish');

  const date = frame?.fixture_date_time
    ? new Date(frame.fixture_date_time).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : '';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-stretch overflow-hidden rounded-2xl border border-theme-gray-5 bg-bg-grouped-2">
      <FixtureStatusBadge status={frame.fixture_status} />
      <View
        style={{ borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }}
        className={`w-1.5 ${styles.bar}`}
      />
      <View className="flex-1 gap-1 px-3 py-2">
        <Text className="font-saira-medium text-sm text-text-2" numberOfLines={1}>
          {frame?.competition_name ?? 'Fixture'}
          {frame?.stage_name ? ` | ${frame.stage_name}` : ''}
          {date ? ` | ${date}` : ''} | Frame {frame?.frame_number}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-row">
            {opponents.map((opponent, i) => (
              <View key={opponent?.id ?? i} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                <Avatar size={28} borderRadius={8} player={opponent} />
              </View>
            ))}
          </View>
          <View className="flex-1">
            <Text className="font-saira-medium text-base text-text-1" numberOfLines={1}>
              vs {opponents.map(fullName).join(' & ')}
            </Text>
            {partner && (
              <Text className="font-saira text-sm text-text-2" numberOfLines={1}>
                with {fullName(playersById.get(partner))}
              </Text>
            )}
          </View>
        </View>
        {myAchievements.length > 0 && (
          <View className="mt-2 flex-row items-center gap-1.5">
            {myAchievements.map((label) => {
              const config = ACHIEVEMENT_CONFIG[label];
              const Icon = config.icon;
              return (
                <View
                  key={label}
                  className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${config.bgClass}`}>
                  <Icon size={12} color={config.color} />
                  <Text className={`font-saira-medium text-xs ${config.textClass}`}>{label}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
      <View
        style={{ top: 6, right: 6, position: 'absolute' }}
        className="items-center justify-center">
        <Text className={`rounded-xl px-3 py-1 font-saira-semibold text-base ${styles.pill}`}>
          {result}
          {frame?.forfeited ? '*' : ''}
        </Text>
      </View>
    </Pressable>
  );
};

const EmptyFramesState = () => (
  <View className="h-full items-center justify-center gap-3 px-6 py-16">
    <Ionicons name="file-tray-outline" size={80} color="rgba(0,0,0,0.2)" />
    <Text className="mt-3 font-saira-semibold text-2xl text-text-1">No Frames Played</Text>
    <Text className="mt-1 px-8 text-center font-saira-medium text-lg text-text-3">
      Once this player takes part in a fixture, their frame history will show up here.
    </Text>
  </View>
);

const PlayerFrameList = ({ playerId }) => {
  const { player } = useUser();
  const { frames, playersById, hasNextPage, isFetchingNextPage, fetchNextPage, isLoading } =
    usePlayerFrames(playerId);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-bg-grouped-1 pb-16">
      <FlatList
        style={{ padding: 10 }}
        data={frames}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FrameRow frame={item} playersById={playersById} player={player} />
        )}
        ListEmptyComponent={EmptyFramesState}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

export default PlayerFrameList;
