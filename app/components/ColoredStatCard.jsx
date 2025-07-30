import { Text, View } from 'react-native';
import React from 'react';

const ColoredStatCard = ({ label, value, color, textSize = 40, lineHeight = 50 }) => {
  let borderColor;
  let backgroundColor;

  switch (color) {
    case 'green':
      borderColor = 'border-theme-green';
      backgroundColor = 'bg-theme-green/20';
      break;
    case 'red':
      borderColor = 'border-theme-red';
      backgroundColor = 'bg-theme-red/20';
      break;
    case 'gray':
      borderColor = 'border-theme-gray-4';
      backgroundColor = 'bg-theme-gray-4/20';
      break;
    case 'yellow':
      borderColor = 'border-theme-yellow';
      backgroundColor = 'bg-theme-yellow/20';
      break;
    case 'blue':
      borderColor = 'border-theme-blue';
      backgroundColor = 'bg-theme-blue/20';
      break;
    default:
      borderColor = 'border-white';
      backgroundColor = 'bg-white/20';
  }
  return (
    <View
      className={`h-24 flex-1 items-start justify-center rounded-xl border ${borderColor} ${backgroundColor} px-4 pt-4`}>
      <Text className="font-saira-semibold text-2xl text-text-2">{label}</Text>
      <Text
        style={{ lineHeight: lineHeight, fontSize: textSize }}
        numberOfLines={1}
        className="font-saira-semibold text-text-1">
        {value}
      </Text>
    </View>
  );
};

export default ColoredStatCard;
