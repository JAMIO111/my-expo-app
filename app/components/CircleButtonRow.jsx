import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CircleButton = ({ label = 'Add New League', icon = 'add' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View className="flex-1 items-center gap-3">
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[{ height: 74, width: 74, transform: [{ scale: scaleAnim }] }]}
          className="items-center justify-center rounded-full border border-brand-light bg-brand-dark shadow shadow-brand-light">
          <Ionicons name={icon} size={50} color="white" />
        </Animated.View>
      </Pressable>
      <Text style={{ lineHeight: 20 }} className="text-center font-saira text-lg text-white">
        {label}
      </Text>
    </View>
  );
};

const CircleButtonRow = () => {
  return (
    <View className="flex-row items-center justify-between rounded-lg py-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <CircleButton key={index} />
      ))}
    </View>
  );
};

export default CircleButtonRow;

const styles = StyleSheet.create({});
