import { StyleSheet, Text, View } from 'react-native';

const StatCardCompare = ({ stat, homeTeam, awayTeam }) => {
  const absHome = Math.abs(stat.homeValue);
  const absAway = Math.abs(stat.awayValue);
  const total = absHome + absAway;

  const isDifferential = stat.differential;

  let homeRatio;
  let awayRatio;

  if (isDifferential) {
    // Compare performance (higher is better)
    const min = Math.min(stat.homeValue, stat.awayValue);
    const max = Math.max(stat.homeValue, stat.awayValue);
    const range = max - min || 1;

    homeRatio = 2;
    awayRatio = 4;
  } else {
    // Simple share-of-total ratio
    const total = stat.homeValue + stat.awayValue;

    if (total === 0) {
      homeRatio = 0.5;
      awayRatio = 0.5;
    } else {
      homeRatio = stat.homeValue / total;
      awayRatio = stat.awayValue / total;
    }
  }

  return (
    <View className="px-2 pb-3 pt-2">
      <View className="flex-row items-start justify-between">
        <Text className="w-32 text-left font-saira text-2xl font-bold text-text-1">
          {stat.differential ? (stat.homeValue > 0 ? '+' : stat.homeValue < 0 ? '-' : '') : ''}{' '}
          {stat.homeValue} {stat.isPercentage && '%'}
        </Text>
        <Text className="flex-1 text-center font-saira text-lg font-medium text-text-2">
          {stat.statName}
        </Text>
        <Text className="w-32 text-right font-saira text-2xl font-bold text-text-1">
          {stat.differential ? (stat.awayValue > 0 ? '+' : stat.awayValue < 0 ? '-' : '') : ''}{' '}
          {stat.awayValue} {stat.isPercentage && '%'}
        </Text>
      </View>

      {/* Combined Bar */}
      <View className="mt-1 h-2 w-full flex-row gap-2 overflow-hidden rounded-full">
        <View
          className="rounded-full"
          style={{
            width: `${homeRatio * 100}%`,
            backgroundColor: homeTeam?.crest?.color1 || '#f2ca02',
            height: '100%',
          }}
        />
        <View
          className="rounded-full"
          style={{
            width: `${awayRatio * 100}%`,
            backgroundColor: awayTeam?.crest?.color1 || '#FF0000',
            height: '100%',
          }}
        />
      </View>
    </View>
  );
};

export default StatCardCompare;

const styles = StyleSheet.create({});
