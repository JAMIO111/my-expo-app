import { useEffect, useRef } from 'react';
import { Animated, View, Text } from 'react-native';

const LivePulseCard = ({ fontSize = 14, dotSize = 8 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const ringSize = dotSize * 1.5; // pulse ring bigger than dot
  const containerSize = ringSize;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.6,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View
      className="mb-1 flex-row items-center justify-center gap-2 rounded-lg bg-theme-gray-5 px-2 py-0.5"
      style={{ alignSelf: 'flex-start' }} // shrink-wrap content
    >
      <View
        style={{
          width: containerSize,
          height: containerSize,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
        {/* Pulsing ring */}
        <Animated.View
          style={{
            position: 'absolute',
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: 1,
            borderColor: '#ef4444',
            transform: [{ scale }],
            opacity,
          }}
        />

        {/* Solid dot */}
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: '#ef4444',
          }}
        />
      </View>

      <Text
        style={{
          fontSize,
          fontFamily: 'Saira-Medium',
          color: '#111111',
        }}>
        Live
      </Text>
    </View>
  );
};

export default LivePulseCard;
