import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Polygon } from 'react-native-svg';

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const RAY_COUNT = 10;

export default function SpinningSun({
  size = 500,
  color = '#FFD83D',
  rayOpacity = 0.35,
  speed = 18000,
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: speed,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${rotation.value}deg`,
      },
    ],
  }));

  const cx = size / 2;
  const cy = size / 2;

  const innerRadius = size * 0.05;
  const outerRadius = size * 0.72;

  const rayAngle = 360 / RAY_COUNT / 2;

  const rays = Array.from({ length: RAY_COUNT }, (_, i) => {
    const angle = (360 / RAY_COUNT) * i;

    const a1 = ((angle - rayAngle / 2) * Math.PI) / 180;
    const a2 = ((angle + rayAngle / 2) * Math.PI) / 180;

    const innerLeft = {
      x: cx + Math.cos(a1) * innerRadius,
      y: cy + Math.sin(a1) * innerRadius,
    };

    const innerRight = {
      x: cx + Math.cos(a2) * innerRadius,
      y: cy + Math.sin(a2) * innerRadius,
    };

    const outerLeft = {
      x: cx + Math.cos(a1) * outerRadius,
      y: cy + Math.sin(a1) * outerRadius,
    };

    const outerRight = {
      x: cx + Math.cos(a2) * outerRadius,
      y: cy + Math.sin(a2) * outerRadius,
    };

    return (
      <Polygon
        key={i}
        points={[
          `${innerLeft.x},${innerLeft.y}`,
          `${outerLeft.x},${outerLeft.y}`,
          `${outerRight.x},${outerRight.y}`,
          `${innerRight.x},${innerRight.y}`,
        ].join(' ')}
        fill={color}
        opacity={i % 2 === 0 ? rayOpacity : rayOpacity * 0.55}
      />
    );
  });

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}>
      {/* Static glow */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFF7B0" stopOpacity="0.8" />

            <Stop offset="0.35" stopColor={color} stopOpacity="0.25" />

            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle cx={cx} cy={cy} r={size * 0.48} fill="url(#sunGlow)" />
      </Svg>

      {/* ROTATING RAYS */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.rayLayer,
          {
            width: size,
            height: size,
          },
          animatedStyle,
        ]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {rays}
        </Svg>
      </Animated.View>

      {/* Static centre */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cy} r={size * 0.09} fill={color} opacity={0.25} />

        <Circle cx={cx} cy={cy} r={size * 0.045} fill="#FFF7B0" opacity={0.7} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rayLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
