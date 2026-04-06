import { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const CustomDropdown = ({
  title,
  titleColor,
  placeholder = 'Select option',
  value,
  options = [],
  onChange,
  leftIconName,
  leftIconSize = 24,
  iconColor = '#9CA3AF',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <View>
      <Text className={`pb-1 pl-2 font-saira-medium text-xl text-text-on-brand ${titleColor}`}>
        {title}
      </Text>

      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`h-14 flex-row items-center rounded-xl border border-theme-gray-3 bg-input-background pr-3 ${
          disabled ? 'opacity-50' : ''
        }`}>
        <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
          <Ionicons name={leftIconName} size={leftIconSize} color={iconColor} />
        </View>

        <Text
          className={`flex-1 pl-5 font-saira text-xl ${value ? 'font-medium text-text-1' : 'text-gray-400'}`}>
          {selectedLabel}
        </Text>

        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>

      <Modal transparent animationType="fade" visible={open}>
        <Pressable
          className="flex-1 justify-center bg-black/40 px-6"
          onPress={() => setOpen(false)}>
          <View className="rounded-xl bg-bg-1">
            <View className="flex-row border-b border-theme-gray-3 px-4 py-3">
              <Text className="flex-1 font-saira-medium text-xl text-text-1">{title}</Text>
              <Ionicons name="close" size={24} color="#9CA3AF" onPress={() => setOpen(false)} />
            </View>
            <FlatList
              contentContainerStyle={{ gap: 8, padding: 12 }}
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    item.value === value ? onChange(null) : onChange(item.value);
                    setOpen(false);
                  }}
                  className={`rounded-lg border bg-bg-2 px-4 py-2 shadow-sm ${item.value === value ? 'border-brand' : 'border-transparent'}`}>
                  <Text className="font-saira-medium text-xl text-text-1">{item.label}</Text>
                  {item.subLabel && <Text className="font-saira text-text-2">{item.subLabel}</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default CustomDropdown;
