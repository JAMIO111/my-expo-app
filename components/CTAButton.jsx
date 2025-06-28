import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';

const CTAButton = ({ text, icon, callbackFn }) => {
  return (
    <Pressable
      onPress={callbackFn}
      className="bg-brand border-border-color h-16 w-full items-center justify-center rounded-lg border">
      {icon && <View className="absolute left-4">{icon}</View>}
      <Text className="text-xl text-white">{text}</Text>
    </Pressable>
  );
};

export default CTAButton;

const styles = StyleSheet.create({});
