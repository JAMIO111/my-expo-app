import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';

export default function SlidingSelector({
  options = [],
  value,
  onChange,
  getLabel = (opt) => opt.label ?? opt,
  getValue = (opt) => opt.value ?? opt,
  height = 44, // Keep this even for pixel-perfect centering
  indicatorColor = 'bg-brand-dark',
  activeTextColor = '#ffffff',
  inactiveTextColor = '#374151',
  bgColor = 'bg-bg-grouped-2',
  borderRadius = 16,
  innerPadding = 4, // The "slideway" width
  fontSize = 15,
  fontWeight = '600',
  style,
}) {
  const [optionWidths, setOptionWidths] = useState({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;

  // Mathematical correction for nested border radius
  const indicatorRadius = Math.max(0, borderRadius - innerPadding);

  const allLayoutsReady =
    options.length > 0 && options.every((_, i) => typeof optionWidths[i] === 'number');

  useEffect(() => {
    const selectedIndex = options.findIndex((o) => getValue(o) === getValue(value));
    if (selectedIndex < 0 || !allLayoutsReady) return;

    const offset = Object.keys(optionWidths)
      .map(Number)
      .sort((a, b) => a - b)
      .filter((key) => key < selectedIndex)
      .reduce((sum, key) => sum + optionWidths[key], 0);

    const targetWidth = optionWidths[selectedIndex];

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: offset + innerPadding,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(widthAnim, {
        toValue: targetWidth,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, optionWidths, options, allLayoutsReady]);

  const handleLayout = (index) => (event) => {
    const { width } = event.nativeEvent.layout;
    setOptionWidths((prev) => ({ ...prev, [index]: width }));
  };

  return (
    <View
      className={bgColor}
      style={[
        {
          flexDirection: 'row',
          borderRadius: borderRadius,
          height: height,
          padding: innerPadding,
          position: 'relative',
          alignItems: 'center', // Fixes vertical "top-heavy" look
          justifyContent: 'center',
        },
        style,
      ]}>
      {allLayoutsReady && (
        <Animated.View
          className={indicatorColor}
          style={{
            position: 'absolute',
            left: slideAnim,
            // Height is exactly the inner height of the container
            height: height - innerPadding * 2,
            width: widthAnim,
            borderRadius: indicatorRadius, // Fixed radius logic
          }}
        />
      )}

      {options.map((option, index) => {
        const optValue = getValue(option);
        const isActive = getValue(value) === optValue;

        return (
          <Pressable
            key={`${optValue}-${index}`}
            onPress={() => onChange(option.value ?? option)}
            onLayout={handleLayout(index)}
            style={{
              flex: 1,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
            }}>
            <Text
              style={{
                color: isActive ? activeTextColor : inactiveTextColor,
                fontSize,
                fontWeight,
              }}>
              {getLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
