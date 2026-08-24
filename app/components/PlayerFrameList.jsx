import { usePlayerFrames } from '@/hooks/usePlayerFrames';
import { FlatList, View, Text } from 'react-native';
import Avatar from './Avatar';
import { useUser } from '@contexts/UserProvider';
import Heading from './Heading';

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

const FrameRow = ({ frame, playersById, player }) => {
  const homePlayer1 = playersById.get(frame.home_player_1);
  const awayPlayer1 = playersById.get(frame.away_player_1);
  const homePlayer2 = frame.home_player_2 ? playersById.get(frame.home_player_2) : null;
  const awayPlayer2 = frame.away_player_2 ? playersById.get(frame.away_player_2) : null;

  const mySide =
    frame.home_player_1 === player?.id || frame.home_player_2 === player?.id ? 'home' : 'away';
  const result =
    frame.winner_side === null ? 'Draw' : frame.winner_side === mySide ? 'Win' : 'Loss';

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
      <View
        style={{ borderBottomRightRadius: 20, borderBottomLeftRadius: 20 }}
        className="w-full flex-row items-center justify-between gap-2 overflow-hidden">
        <Text
          className={`w-full py-1 text-center font-saira-semibold text-xl ${result === 'Win' ? 'bg-theme-green/20 text-theme-green' : result === 'Loss' ? 'bg-theme-red/20 text-theme-red' : 'bg-theme-blue/20 text-theme-blue'}`}>
          {result} {frame?.forfeited ? '(Forfeit)' : ''}
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
    <View className="flex-1 bg-bg-2">
      <Heading className="text-text-1" text="Frames" subtitle={`Total: ${frames.length}`} />
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
