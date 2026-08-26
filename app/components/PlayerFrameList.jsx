import { usePlayerFrames } from '@/hooks/usePlayerFrames';
import { FlatList, View, Text } from 'react-native';
import Avatar from './Avatar';
import { useUser } from '@contexts/UserProvider';
import { ArrowUpDown, Undo2, Zap } from 'lucide-react-native';

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

const AchievementCard = ({ player, labels }) => {
  return (
    <View className="my-1 gap-2 rounded-2xl border border-theme-gray-5 bg-bg-2 px-3 py-2">
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

const FrameRow = ({ frame, playersById, player }) => {
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
    <View className="my-2 gap-2 rounded-3xl border border-theme-gray-5 bg-bg-1">
      <View
        style={{ borderTopRightRadius: 20, borderTopLeftRadius: 20 }}
        className="gap-2 px-3 pt-3">
        <View className="flex-row items-center justify-between gap-2 border-b border-theme-gray-5 pb-1">
          <Text className="p-1 font-saira-medium text-sm text-text-2">
            {frame?.competition_name} {frame?.stage_name ? ` | ${frame.stage_name}` : ''}
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

const PlayerFrameList = ({ playerId }) => {
  const { player } = useUser();
  const { frames, playersById, hasNextPage, isFetchingNextPage, fetchNextPage, isLoading } =
    usePlayerFrames(playerId);

  console.log('PlayerFrameList Rendered with frames:', frames);

  if (isLoading) {
    return (
      <View>
        <Text>Loading frames...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-2 pb-16">
      <FlatList
        style={{ padding: 10 }}
        data={frames}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FrameRow frame={item} playersById={playersById} player={player} />
        )}
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
