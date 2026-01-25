import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const DonutChart = ({
  wins = 0,
  draws = 0,
  losses = 0,
  size = 128,
  strokeWidth = 12,
  statTitle = 'Total',
}) => {
  const total = wins + draws + losses;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeDasharray="4 4"
            fill="none"
          />
        </Svg>

        <View className="absolute items-center justify-center">
          <Text className="font-saira-semibold text-2xl text-text-1">0</Text>
          <Text className="px-6 text-center text-sm text-text-2">No matches yet</Text>
        </View>
      </View>
    );
  }

  const winLength = (wins / total) * circumference;
  const drawLength = (draws / total) * circumference;
  const lossLength = (losses / total) * circumference;

  const winOffset = 0;
  const drawOffset = -winLength;
  const lossOffset = -(winLength + drawLength);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#15803d"
            strokeWidth={strokeWidth}
            strokeDasharray={`${winLength} ${circumference}`}
            strokeDashoffset={winOffset}
            fill="none"
          />

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#eab308"
            strokeWidth={strokeWidth}
            strokeDasharray={`${drawLength} ${circumference}`}
            strokeDashoffset={drawOffset}
            fill="none"
          />

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#dc2626"
            strokeWidth={strokeWidth}
            strokeDasharray={`${lossLength} ${circumference}`}
            strokeDashoffset={lossOffset}
            fill="none"
          />
        </G>
      </Svg>

      <View className="absolute inset-0 items-center justify-center">
        <Text className="font-saira-semibold text-2xl text-text-1">{total}</Text>
        <Text className="text-md px-8 text-center text-text-2">{statTitle}</Text>
      </View>
    </View>
  );
};

export default DonutChart;
