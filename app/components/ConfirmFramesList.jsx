import { Pressable, StyleSheet, Text, View } from 'react-native';

const getPlayerNames = (...players) =>
  players
    .filter(Boolean)
    .map((p) => `${p.first_name} ${p.surname}`)
    .join(' & ');

const ConfirmFramesList = ({ results, isLoading, disputedFrames, setDisputedFrames }) => {
  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View className="flex-1 bg-bg-grouped-2">
      {results?.length > 0 ? (
        results.map((result, index) => {
          const homeWinner = result.winner_side === 'home';
          const awayWinner = result.winner_side === 'away';
          const isDisputed = disputedFrames.includes(result.id);
          const doublesMatch = result.home_player_2 && result.away_player_2;

          return (
            <Pressable
              key={result.id}
              onPress={() => {
                setDisputedFrames((prev) =>
                  prev.includes(result.id)
                    ? prev.filter((id) => id !== result.id)
                    : [...prev, result.id]
                );
              }}>
              <View className="relative mt-1 gap-1 pb-3">
                {/* Frame Title */}
                <Text
                  className={`${
                    isDisputed ? 'font-semibold text-theme-red' : 'font-medium'
                  } pl-5 font-saira text-text-2`}>
                  {isDisputed
                    ? `Frame ${result.frame_number} - Disputed`
                    : `Frame ${result.frame_number}`}
                </Text>

                {/* Home */}
                <View className="flex-row items-center justify-between gap-3">
                  <View
                    className={`${homeWinner ? (isDisputed ? 'bg-theme-red' : 'bg-brand') : 'bg-transparent'}`}
                    style={styles.indicator}
                  />

                  <Text
                    numberOfLines={1}
                    className={`${
                      homeWinner ? 'font-saira-semibold' : 'font-saira'
                    } mt-1 flex-1 ${doublesMatch ? 'text-lg' : 'text-xl'} text-text-1`}>
                    {getPlayerNames(result.home_player_1, result.home_player_2)}
                  </Text>

                  <Text
                    className={`${
                      homeWinner ? 'font-saira-semibold text-text-1' : 'font-saira text-text-2'
                    } pr-5 ${doublesMatch ? 'text-lg' : 'text-xl'}`}>
                    {homeWinner ? 'Winner' : 'Loser'}
                  </Text>
                </View>

                {/* Away */}
                <View className="flex-row items-center justify-between gap-3">
                  <View
                    className={`${awayWinner ? (isDisputed ? 'bg-theme-red' : 'bg-brand') : 'bg-transparent'}`}
                    style={styles.indicator}
                  />

                  <Text
                    numberOfLines={1}
                    className={`${
                      awayWinner ? 'font-saira-semibold' : 'font-saira'
                    } mt-1 flex-1 ${doublesMatch ? 'text-lg' : 'text-xl'} text-text-1`}>
                    {getPlayerNames(result.away_player_1, result.away_player_2)}
                  </Text>

                  <Text
                    className={`${
                      awayWinner ? 'font-saira-semibold text-text-1' : 'font-saira text-text-2'
                    } pr-5 ${doublesMatch ? 'text-lg' : 'text-2xl'}`}>
                    {awayWinner ? 'Winner' : 'Loser'}
                  </Text>
                </View>

                {/* Divider */}
                {index !== results.length - 1 && (
                  <View className="mx-5 border-b border-theme-gray-5" />
                )}
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

const styles = StyleSheet.create({
  indicator: {
    height: 26,
    width: 5,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
});
