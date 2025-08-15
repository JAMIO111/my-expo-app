import { forwardRef } from 'react';
import { View, TextInput, Text, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const CustomTextInput = forwardRef((props, ref) => {
  const {
    value,
    onChangeText,
    titleColor,
    placeholder,
    title,
    leftIconName,
    leftIconSize = 24,
    iconColor = '#9CA3AF',
    keyboardType = 'default',
    clearButtonMode = 'while-editing',
    editable = true,
    maxLength,
  } = props;

  return (
    <View>
      <Text className={`font-saira-medium text-lg ${titleColor}`}>{title}</Text>
      <View className="h-14 flex-row items-center rounded-xl border border-theme-gray-3 bg-input-background pr-3">
        <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
          <Ionicons name={leftIconName} size={leftIconSize} color={iconColor} />
        </View>
        <TextInput
          editable={editable}
          keyboardType={keyboardType}
          style={{ lineHeight: 28 }}
          clearButtonMode={clearButtonMode}
          className="flex-1 py-1 pl-3 font-saira text-xl text-text-1"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
        />
      </View>
    </View>
  );
});

export default CustomTextInput;
