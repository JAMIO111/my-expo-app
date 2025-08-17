import { Pressable, StyleSheet, Text, View } from 'react-native';

const ConfirmFramesList = ({ results, isLoading, disputedFrames, setDisputedFrames }) => {
  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View className="flex-1 bg-bg-grouped-2">
      {results?.length > 0 ? (
        results.map((result, index) => {
          const homeWinner = result.home_player.id === result.winner_id;
          const awayWinner = result.away_player.id === result.winner_id;
          return (
            <Pressable
              onPress={() => {
                // Handle frame press
                setDisputedFrames((prev) => {
                  if (prev.includes(result.id)) {
                    return prev.filter((id) => id !== result.id);
                  } else {
                    return [...prev, result.id];
                  }
                });
              }}
              key={result.id}>
              <View className="relative mt-1 gap-1">
                <Text
                  className={`${disputedFrames.includes(result.id) ? 'font-semibold text-theme-red' : 'font-medium'} pl-5 font-saira text-text-2`}>
                  {disputedFrames.includes(result.id)
                    ? `Frame ${result.frame_number} - Disputed`
                    : `Frame ${result.frame_number}`}
                </Text>
                <View className="flex-row items-center justify-between gap-3">
                  <View
                    className={`${homeWinner ? 'bg-brand' : 'bg-transparent'}`}
                    style={{
                      height: 26, // h-6 = 26px
                      width: 5, // w-2 = 5px
                      borderTopRightRadius: 5, // rounded-r = 5px
                      borderBottomRightRadius: 5,
                    }}></View>
                  <Text
                    numberOfLines={1}
                    className={`${homeWinner ? 'font-saira-semibold' : 'font-saira'} mt-1 flex-1 text-2xl text-text-1`}>
                    {result.home_player.first_name} {result.home_player.surname}
                  </Text>
                  <Text
                    className={`${homeWinner ? 'font-saira-semibold text-text-1' : 'font-saira text-text-2'} pr-5 text-2xl`}>
                    {homeWinner ? 'Winner' : 'Loser'}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between gap-3">
                  <View
                    className={`${awayWinner ? 'bg-brand' : 'bg-transparent'}`}
                    style={{
                      height: 26, // h-6 = 26px
                      width: 5, // w-2 = 5px
                      borderTopRightRadius: 5, // rounded-r = 5px
                      borderBottomRightRadius: 5,
                    }}></View>
                  <Text
                    numberOfLines={1}
                    className={`${awayWinner ? 'font-saira-semibold' : 'font-saira'} mt-1 flex-1 text-2xl text-text-1`}>
                    {result.away_player.first_name} {result.away_player.surname}{' '}
                  </Text>
                  <Text
                    className={`${awayWinner ? 'font-saira-semibold text-text-1' : 'font-saira text-text-2'} pr-5 text-2xl`}>
                    {awayWinner ? 'Winner' : 'Loser'}
                  </Text>
                </View>
                <View
                  className={`${index !== results.length - 1 ? 'mx-5 border-b border-theme-gray-5' : ''}`}></View>
              </View>
            </Pressable>
          );
        })
      ) : (
        <Text className="px-12 py-16 text-center font-saira text-xl text-text-2">
          No frames have been submitted for this fixture yet.
        </Text>
      )}
    </View>
  );
};

export default ConfirmFramesList;

const styles = StyleSheet.create({});
