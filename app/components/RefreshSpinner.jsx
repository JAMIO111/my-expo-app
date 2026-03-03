import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RefreshSpinner = ({ refreshing, size = 32, color = '#063d12' }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (refreshing) {
      // 1. Fade in and Scale up
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Continuous Rotation Loop
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.4, 0, 0.2, 1), // Modern "snappy" easing
          useNativeDriver: true,
        })
      ).start();
    } else {
      // 3. Fade out and reset
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
        scaleAnim.setValue(0.8);
      });
    }
  }, [refreshing]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Don't render if it's not refreshing and has finished fading out
  if (!refreshing && opacityAnim === 0) return null;

  return (
    <View className="h-12 w-full items-center justify-center">
      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ rotate: spin }, { scale: scaleAnim }],
        }}>
        <Ionicons name="reload-circle" size={size} color={color} />
      </Animated.View>
    </View>
  );
};

export default RefreshSpinner;
