import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import CTAButton from './CTAButton';

const CustomMultiSelect = ({
  options = [], // [{ label: 'Individual', value: 'individual' }]
  selectedValues = [],
  onValueChange,
  title,
  placeholder = 'Select options...',
  leftIconName = 'list-outline',
  iconColor = '#9CA3AF',
  titleColor = 'text-text-on-brand',
  multiSelect = false, // For future use if we want to toggle between single/multi select
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleSelection = (value) => {
    // 1. Check if value is already in the array
    const isSelected = selectedValues.includes(value);

    if (isSelected) {
      // 2. If it's already selected, remove it (Toggle Off)
      onValueChange(selectedValues.filter((v) => v !== value));
    } else {
      // 3. If it's not selected, add it (Toggle On)
      if (multiSelect) {
        onValueChange([...selectedValues, value]);
      } else {
        onValueChange([value]);
      }
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      return options.find((o) => o.value === selectedValues[0])?.label;
    }
    return `${selectedValues.length} items selected`;
  };

  return (
    <View className="mb-4">
      <Text className={`pb-1 pl-2 font-saira-medium text-xl ${titleColor}`}>{title}</Text>

      {/* Trigger Button - Matches CustomTextInput style */}
      <Pressable
        onPress={() => setIsVisible(true)}
        className="h-14 flex-row items-center rounded-xl border border-theme-gray-3 bg-input-background pr-3">
        <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
          <Ionicons name={leftIconName} size={24} color={iconColor} />
        </View>

        <Text
          numberOfLines={1}
          className={`flex-1 pl-3 font-saira text-xl ${selectedValues.length > 0 ? 'text-text-1' : 'text-gray-400'}`}>
          {getDisplayText()}
        </Text>

        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>

      {/* Selection Modal */}
      <Modal visible={isVisible} transparent animationType="fade">
        <Pressable onPress={() => setIsVisible(false)} className="flex-1 justify-end bg-black/40">
          <View className="h-1/2 w-full rounded-t-3xl bg-bg-grouped-2 p-6">
            <View className="flex-row items-center justify-between border-b border-theme-gray-3 pb-4">
              <Text className="font-saira-bold text-2xl text-text-1">{title}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons name="close" size={32} color={iconColor} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ paddingVertical: 20 }}
              renderItem={({ item }) => {
                const isSelected = selectedValues.includes(item.value);
                return (
                  <TouchableOpacity
                    onPress={() => toggleSelection(item.value)}
                    className={`mb-4 flex-row items-center justify-between rounded-xl p-4 ${
                      isSelected
                        ? 'border border-theme-purple bg-theme-purple/20'
                        : 'border border-theme-gray-6 bg-bg-2'
                    }`}>
                    <Text
                      className={`font-saira-medium text-lg ${isSelected ? 'text-text-1' : 'text-text-1'}`}>
                      {item.label.slice(0, 1).toUpperCase() + item.label.slice(1)}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#A259FF" />}
                  </TouchableOpacity>
                );
              }}
            />

            <CTAButton type="yellow" text="Done" callbackFn={() => setIsVisible(false)} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default CustomMultiSelect;
