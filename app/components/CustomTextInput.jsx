import { forwardRef } from 'react';
import { View, TextInput, Text, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const CustomTextInput = forwardRef((props, ref) => {
  const {
    value,
    onChangeText,
    titleColor = 'text-text-on-brand',
    placeholder,
    title,
    leftIconName,
    height = 'h-14',
    leftIconSize = 24,
    iconColor = '#8B5CF6',
    keyboardType = 'default',
    clearButtonMode = 'while-editing',
    editable = true,
    maxLength,
    multiline = false,
    numberOfLines = 1,
    maximumValue, // ✅ New prop
    returnKeyType = 'default',
    onSubmitEditing,
    autoComplete = 'off',
    autoCapitalize = 'none',
    autoCorrect = false,
    textContentType = 'none',
    onBlur,
    disabled = false,
  } = props;

  // Handles numeric input enforcement
  const handleTextChange = (text) => {
    let newValue = text;

    // If numeric keyboard, enforce digits only
    if (keyboardType === 'numeric' || keyboardType === 'number-pad') {
      newValue = newValue.replace(/[^0-9]/g, '');

      if (maximumValue !== undefined) {
        const num = parseInt(newValue, 10);
        if (!isNaN(num) && num > maximumValue) {
          newValue = '';
        }
      }
    }

    onChangeText && onChangeText(newValue);
  };

  return (
    <View>
      <Text className={`pb-1 pl-2 font-saira-medium text-xl ${titleColor}`}>{title}</Text>
      <View
        style={{ height: multiline ? 30 * numberOfLines : 56 }}
        className={`${disabled ? 'opacity-50' : ''} h-14 flex-row ${multiline ? 'items-start' : 'items-center'} rounded-xl border border-theme-gray-3 bg-input-background pr-3`}>
        <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
          <Ionicons name={leftIconName} size={leftIconSize} color={iconColor} />
        </View>
        <TextInput
          editable={editable && !disabled}
          keyboardType={keyboardType}
          style={{ lineHeight: 30 }}
          clearButtonMode={clearButtonMode}
          className="flex-1 py-1 pl-3 font-saira text-xl text-text-1"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={handleTextChange}
          maxLength={maxLength}
          ref={ref}
          multiline={multiline}
          numberOfLines={numberOfLines}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onBlur={onBlur}
          disabled={disabled}
        />
      </View>
    </View>
  );
});

export default CustomTextInput;
