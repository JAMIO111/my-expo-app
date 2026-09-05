import { useEffect, useRef } from 'react';
import { Animated, View, Text } from 'react-native';

const LivePulseCard = ({ fontSize = 14, dotSize = 8, showBG = true, text = 'Live' }) => {
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
      className={`flex-row items-center justify-center gap-2 rounded-xl px-3 py-0.5 ${showBG ? 'bg-bg-1 shadow-sm' : ''}`}>
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
          fontFamily: 'Tektur-SemiBold',
          color: '#111111',
        }}>
        {text}
      </Text>
    </View>
  );
};

export default LivePulseCard;
