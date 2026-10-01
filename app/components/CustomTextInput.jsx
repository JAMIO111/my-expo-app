import { forwardRef } from 'react';
import { View, TextInput, Text, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetTextInput, useBottomSheetInternal } from '@gorhom/bottom-sheet';

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
    backgroundColor = 'bg-bg-grouped-3',
  } = props;

  // Inside a @gorhom/bottom-sheet the sheet has to know which input is focused
  // to lift itself above the keyboard, so use its input; elsewhere a plain one.
  const inSheet = !!useBottomSheetInternal(true);
  const Input = inSheet ? BottomSheetTextInput : TextInput;

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
        className={`${disabled ? 'opacity-50' : ''} h-14 flex-row ${multiline ? 'items-start' : 'items-center'} rounded-2xl border border-theme-gray-3 ${backgroundColor} pr-3`}>
        <View className="h-full justify-center pl-3 pr-4 focus-within:border-2">
          <Ionicons name={leftIconName} size={leftIconSize} color={iconColor} />
        </View>
        <Input
          editable={editable && !disabled}
          keyboardType={keyboardType}
          style={{ lineHeight: 30 }}
          clearButtonMode={clearButtonMode}
          className="flex-1 py-1 pb-2 pl-3 font-saira text-xl text-text-1"
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
