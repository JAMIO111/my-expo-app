import { StyleSheet, Text, View } from 'react-native';

const StatCardCompare = ({ stat, homeTeam, awayTeam }) => {
  const total = stat.homeValue + stat.awayValue;
  const homeRatio = total === 0 ? 0.5 : stat.homeValue / total;
  const awayRatio = total === 0 ? 0.5 : stat.awayValue / total;

  return (
    <View className=" bg-bg-grouped-2 px-4 pb-3 pt-2">
      <View className="flex-row items-start justify-between">
        <Text className="w-32 text-left font-saira text-2xl font-bold text-text-1">
          {stat.homeValue} {stat.isPercentage && '%'}
        </Text>
        <Text className="flex-1 text-center font-saira text-lg font-medium text-text-2">
          {stat.statName}
        </Text>
        <Text className="w-32 text-right font-saira text-2xl font-bold text-text-1">
          {stat.awayValue} {stat.isPercentage && '%'}
        </Text>
      </View>

      {/* Combined Bar */}
      <View className="mt-1 h-2 w-full flex-row gap-1 overflow-hidden rounded-full">
        <View
          className="h-full rounded-full"
          style={{
            flex: homeRatio,
            backgroundColor: homeTeam?.crest?.color1,
          }}
        />
        <View
          className="h-full rounded-full"
          style={{ flex: awayRatio, backgroundColor: awayTeam?.crest?.color1 }}
        />
      </View>
    </View>
  );
};

export default StatCardCompare;

const styles = StyleSheet.create({});
