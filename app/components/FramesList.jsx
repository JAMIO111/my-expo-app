import { Text, View } from 'react-native';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import Avatar from '@components/Avatar';

const FramesList = ({ fixtureId }) => {
  const { data: frames, isLoading } = useResultsByFixture(fixtureId);
  console.log('FramesList frames:', frames);

  if (isLoading) {
    return (
      <View className="h-full px-2">
        <View className="items-center justify-center rounded-3xl bg-bg-1 p-6">
          <Text className="font-saira text-lg text-text-1">Loading frames...</Text>
        </View>
      </View>
    );
  }

  if (!frames || frames.length === 0) {
    return (
      <View className="h-full px-2">
        <View className="items-center justify-center rounded-3xl bg-bg-1 p-6">
          <Text className="font-saira text-lg text-text-1">No frames submitted yet.</Text>
        </View>
      </View>
    );
  }

  // Helper to render a group of players (Home or Away)
  const renderCompetitor = (players, side, winnerSide) => {
    const isWinner = side === winnerSide;

    return (
      <View className="w-full flex-row items-center justify-between px-4 py-1">
        <View className="flex-1">
          {players.map((player, pIdx) => (
            <View
              key={player.id}
              className={`flex-row items-center gap-3 ${pIdx > 0 ? 'mt-1' : ''}`}>
              <Avatar player={player} size={32} />
              <View className="flex-row items-center gap-2">
                <Text className="font-saira text-xl text-text-1">{player.first_name}</Text>
                <Text className="font-saira-semibold text-xl text-text-1">{player.surname}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Frame Score (1 or 0) */}
        <View className="ml-4 items-center justify-center">
          <Text
            className={`${
              isWinner ? 'font-saira-bold text-text-1' : 'font-saira text-text-2'
            } w-10 text-center text-2xl`}>
            {isWinner ? 1 : 0}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex gap-3 pb-8">
      {frames.map((f, index) => (
        <View key={f.id || index} className="rounded-3xl bg-bg-1 px-2 py-4">
          <View className="mb-2 flex-row items-center justify-between px-4">
            <Text className="font-saira-medium text-sm uppercase tracking-widest text-text-2">
              Frame {f.frame_number}
            </Text>
            <View className="flex-row items-center gap-2">
              {f.homeCompetitor.length > 1 && f.awayCompetitor.length > 1 && (
                <View className="rounded bg-theme-gray-3 px-2 py-0.5">
                  <Text className="font-saira-bold text-[10px] uppercase text-black">Doubles</Text>
                </View>
              )}
              {f.is_bonus_frame && (
                <View className="rounded bg-theme-yellow px-2 py-0.5">
                  <Text className="font-saira-bold text-[10px] uppercase text-black">
                    Bonus Frame
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Home side */}
          {renderCompetitor(f.homeCompetitor, 'home', f.winner_side)}

          {/* VS Divider for clear separation in doubles */}
          <View className="my-1 flex flex-row items-center gap-5 px-5 opacity-20">
            <View className="h-[2px] flex-1 rounded bg-theme-gray-3" />
            <Text className="font-saira-bold text-[10px] text-text-2">VS</Text>
            <View className="h-[2px] flex-1 rounded bg-theme-gray-3" />
          </View>

          {/* Away side */}
          {renderCompetitor(f.awayCompetitor, 'away', f.winner_side)}
        </View>
      ))}
    </View>
  );
};

export default FramesList;
