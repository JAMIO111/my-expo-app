import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

// GradientBall component — same as before
const GradientBall = ({ color = '#FFDD44', size = 30 }) => {
  const radius = size / 2;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg height={size} width={size}>
        <Defs>
          <RadialGradient id="grad" cx="0.4" cy="0.4" r="0.7" fx="0.3" fy="0.3">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor="#222" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Circle cx={radius} cy={radius} r={radius} fill="url(#grad)" />
      </Svg>
    </View>
  );
};

export default function LoadingSpinner() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(20000, {
        duration: 95000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const colors = [
    '#fff',
    'red',
    'orange',
    'red',
    'orange',
    'red',
    '#000',
    'orange',
    'red',
    'orange',
    'red',
    'orange',
  ];

  const ballCount = 12;
  const ringRadius = 90;
  const ballDiameter = 30;
  const containerSize = ringRadius * 2 + ballDiameter; // enough to hold balls at edges

  const balls = Array.from({ length: ballCount });

  return (
    <View className={`bg-brand`} style={styles.container}>
      <Animated.View
        style={[
          {
            width: containerSize,
            height: containerSize,
            position: 'relative',
          },
          animatedStyle,
        ]}>
        {balls.map((_, i) => {
          const angle = (360 / ballCount) * i;
          const angleRad = (angle * Math.PI) / 180;
          const x = ringRadius * Math.cos(angleRad);
          const y = ringRadius * Math.sin(angleRad);

          // Pick a color by index, wrap around if fewer colors than balls
          const ballColor = colors[i % colors.length];

          return (
            <View
              key={i}
              style={{
                width: ballDiameter,
                height: ballDiameter,
                borderRadius: ballDiameter / 2,
                position: 'absolute',
                top: containerSize / 2 + y - ballDiameter / 2,
                left: containerSize / 2 + x - ballDiameter / 2,
              }}>
              <GradientBall color={ballColor} size={ballDiameter} />
            </View>
          );
        })}
      </Animated.View>
      <Text className=" mt-16 font-michroma text-5xl font-bold text-white">Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    position: 'relative',
  },
});
