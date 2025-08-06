import { View, Text } from 'react-native';

const greenBG = 'bg-theme-green/20';
const greenBorder = 'border-theme-green';
const yellowBG = 'bg-theme-yellow/20';
const yellowBorder = 'border-theme-yellow';
const redBG = 'bg-theme-red/20';
const redBorder = 'border-theme-red';

const MatchBreakdownBar = ({ wins = 0, losses = 0, draws = 0 }) => {
  const total = wins + losses + draws;

  const hasData = total > 0;

  const segments = hasData
    ? [
        {
          label: 'W',
          value: wins,
          percent: (wins / total) * 100,
          bg: greenBG,
          border: greenBorder,
          textColor: 'text-theme-green',
        },
        {
          label: 'D',
          value: draws,
          percent: (draws / total) * 100,
          bg: yellowBG,
          border: yellowBorder,
          textColor: 'text-text-1',
        },
        {
          label: 'L',
          value: losses,
          percent: (losses / total) * 100,
          bg: redBG,
          border: redBorder,
          textColor: 'text-theme-red',
        },
      ].filter((s) => s.value > 0)
    : [
        {
          label: 'No Data',
          value: 1,
          percent: 100,
          bg: 'bg-theme-blue/20',
          border: 'border-theme-blue',
          textColor: 'text-gray-600',
        },
      ];

  return (
    <View className="mb-4 w-full">
      <Text className="mb-1 font-saira-semibold text-xl text-text-2">Match Breakdown</Text>

      <View className="h-16 w-full flex-row justify-center gap-1 px-1">
        {segments.map((segment, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === segments.length - 1;

          return (
            <View
              key={segment.label}
              style={{
                width: `${segment.percent}%`,
                borderTopRightRadius: isLast ? 8 : 0,
                borderBottomRightRadius: isLast ? 8 : 0,
                borderTopLeftRadius: isFirst ? 8 : 0,
                borderBottomLeftRadius: isFirst ? 8 : 0,
              }}
              className={`h-full items-center justify-center border ${segment.bg} ${segment.border}`}>
              <Text
                numberOfLines={1}
                className={`px-2 font-saira-semibold text-text-1 ${segment.textColor}`}>
                {hasData ? `${segment.value}${segment.label}` : segment.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-saira-medium text-xl text-theme-green">Wins: {wins}</Text>
        <Text className="font-saira-medium text-xl text-text-1">Draws: {draws}</Text>
        <Text className="font-saira-medium text-xl text-theme-red">Losses: {losses}</Text>
      </View>
    </View>
  );
};

export default MatchBreakdownBar;
