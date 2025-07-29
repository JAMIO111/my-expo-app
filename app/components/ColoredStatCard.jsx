import { Text, View } from 'react-native';
import React from 'react';

const ColoredStatCard = ({ label, value, color }) => {
  return (
    <View
      className={`h-24 flex-1 items-start justify-center rounded-xl border border-${color} bg-${color}/20 px-4 pt-4`}>
      <Text className="font-saira-medium text-2xl text-text-2">{label}</Text>
      <Text
        style={{ lineHeight: 55, fontSize: 30 }}
        numberOfLines={1}
        className="font-saira-semibold text-5xl text-text-1">
        {value}
      </Text>
    </View>
  );
};

export default ColoredStatCard;
