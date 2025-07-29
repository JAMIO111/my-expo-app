import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CircularProgress = ({ percentage = 75, size = 120, strokeWidth = 10, textSize = 30 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background channel circle */}
        <Circle
          stroke="#e5e7eb" // Tailwind gray-200
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth - 2}
        />
        {/* Progress circle */}
        <Circle
          stroke="#3b82f6" // Tailwind blue-500
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text
        style={[styles.label, { fontSize: textSize }]}
        className="absolute font-saira-semibold text-text-1">
        {`${Math.round(percentage)}%`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    lineHeight: undefined, // Let fontSize handle vertical centering
  },
});

export default CircularProgress;
