import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const StatCardCompare = ({ stat }) => {
  return (
    <View className="bg-bg-grouped-2 gap-4 rounded-2xl px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      <View className="flex-row items-center justify-between">
        <Text className="text-text-2 text-xl font-bold">{stat.homeValue}</Text>
        <Text className="text-text-1 text-lg font-medium">{stat.statName}</Text>
        <Text className="text-text-2 text-xl font-bold">{stat.awayValue}</Text>
      </View>
      <View className="flex-row items-center gap-5">
        {/* Home Bar - grow from center to left */}
        <View className="bg-bg-grouped-3 h-2.5 flex-1 items-end overflow-hidden rounded-full">
          <View
            className="h-2.5 rounded-full bg-green-700"
            style={{
              width: `${(stat.homeValue / (stat.homeValue + stat.awayValue)) * 100}%`,
            }}
          />
        </View>

        {/* Away Bar - grow from center to right */}
        <View className="bg-bg-grouped-3 h-2.5 flex-1 overflow-hidden rounded-full">
          <View
            className="h-2.5 rounded-full bg-orange-500"
            style={{
              width: `${(stat.awayValue / (stat.homeValue + stat.awayValue)) * 100}%`,
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default StatCardCompare;

const styles = StyleSheet.create({});
