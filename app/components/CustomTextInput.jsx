import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const CustomTextInput = React.forwardRef((props, ref) => {
  const {
    value,
    onChangeText,
    titleColor,
    placeholder,
    title,
    leftIconName,
    leftIconSize = 24,
  } = props;

  return (
    <View>
      <Text className={`font-saira-medium text-lg ${titleColor}`}>{title}</Text>
      <View className="h-16 flex-row items-center rounded-xl border border-theme-gray-3 bg-input-background px-3">
        <View className="border-r-2 border-theme-gray-2 pr-2">
          <Ionicons name={leftIconName} size={leftIconSize} color="#9CA3AF" />
        </View>
        <TextInput
          style={{ lineHeight: 28 }}
          clearButtonMode="while-editing"
          className="ml-2 flex-1 py-1 font-saira text-xl text-text-1"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </View>
  );
});

export default CustomTextInput;
