import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const ResultCard = () => {
  return (
    <View className="bg-background border-border-color h-20 w-full flex-row items-center justify-center gap-5 rounded-lg border">
      <View className="flex-1 items-end">
        <Text className="text-text-primary font-medium">Shankhouse B</Text>
      </View>
      <Text className="bg-background-dark min-w-20 rounded-md px-2 text-center text-2xl font-bold text-white">
        5 - 4
      </Text>
      <View className="flex-1 items-start">
        <Text className="text-text-primary font-medium">Bedlington Station</Text>
      </View>
    </View>
  );
};

export default ResultCard;

const styles = StyleSheet.create({});
