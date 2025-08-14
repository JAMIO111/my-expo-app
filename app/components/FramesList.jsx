import { Text, View } from 'react-native';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import Avatar from '@components/Avatar';

const FramesList = ({ fixtureId }) => {
  const { data: frames, isLoading } = useResultsByFixture(fixtureId);
  console.log('FramesList data:', frames);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!frames || frames.length === 0) {
    return (
      <View className="h-full px-2">
        <View className="items-center justify-center rounded-xl bg-bg-grouped-2 p-6">
          <Text className="font-saira text-lg text-text-1">No frames submitted yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      {frames?.map((f, index) => (
        <View key={index} className="mb-2 mt-2 items-center justify-center gap-2">
          <Text className="w-full px-4 font-saira-medium text-xl text-text-2">
            Frame {f.frame_number}
          </Text>

          {/* Home player row */}
          <View className="w-full flex-row items-center justify-between px-4">
            <View className="flex-row items-center gap-3">
              <Avatar player={f.home_player} size={36} />
              <View className="flex-row items-center gap-2">
                <Text className="font-saira text-2xl text-text-1">{f.home_player.first_name}</Text>
                <Text className="font-saira-semibold text-2xl text-text-1">
                  {f.home_player.surname}
                </Text>
              </View>
            </View>
            <Text
              className={`${
                f.winner?.id === f.home_player.id ? 'font-saira-semibold' : 'font-saira'
              } w-12 text-center text-2xl text-text-1`}>
              {f.winner?.id === f.home_player.id ? 1 : 0}
            </Text>
          </View>

          {/* Away player row */}
          <View className="w-full flex-row items-center justify-between px-4">
            <View className="flex-row items-center gap-3">
              <Avatar player={f.away_player} size={36} />
              <View className="flex-row items-center gap-2">
                <Text className="font-saira text-2xl text-text-1">{f.away_player.first_name}</Text>
                <Text className="font-saira-semibold text-2xl text-text-1">
                  {f.away_player.surname}
                </Text>
              </View>
            </View>
            <Text
              className={`${
                f.winner?.id === f.away_player.id ? 'font-saira-semibold' : 'font-saira'
              } w-12 text-center text-2xl text-text-1`}>
              {f.winner?.id === f.away_player.id ? 1 : 0}
            </Text>
          </View>

          {/* Divider */}
          {index !== frames.length - 1 && <View className="mt-2 h-[1px] w-[95%] bg-theme-gray-4" />}
        </View>
      ))}
    </View>
  );
};

export default FramesList;
