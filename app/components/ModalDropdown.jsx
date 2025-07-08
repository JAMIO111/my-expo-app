import { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';

/**
 * Props:
 * - options: Array of any objects (strings, objects, etc.)
 * - value: current selected value
 * - onChange: function to call when an option is selected
 * - placeholder: string for label
 * - getLabel: function to get display label from item (optional)
 * - getValue: function to get internal value from item (optional)
 */
const ModalDropdown = ({
  options = [],
  placeholder = 'option',
  value,
  onChange,
  getLabel = (item) => (typeof item === 'object' ? item.label : item),
  getValue = (item) => (typeof item === 'object' ? item.value : item),
}) => {
  const { colorScheme } = useColorScheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item) => {
    onChange(getValue(item));
    setModalVisible(false);
  };

  return (
    <View className="flex-1">
      {/* Dropdown Button */}
      <Pressable
        className="flex-row items-center justify-between rounded-md bg-bg-3 px-3 py-3"
        onPress={() => setModalVisible(true)}>
        <Text className={value ? 'text-text-1' : 'text-text-2'}>
          {value
            ? getLabel(options.find((item) => getValue(item) === value))
            : `Select a ${placeholder}`}
        </Text>
        <View className="ml-2 flex-col items-center justify-center">
          <Ionicons name="caret-up" size={12} color="#9CA3AF" />
          <Ionicons name="caret-down" size={12} color="#9CA3AF" />
        </View>
      </Pressable>

      {/* Modal with Blur */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setModalVisible(false)}>
          <BlurView
            intensity={50}
            tint={colorScheme === 'dark' ? 'light' : 'prominent'}
            className="max-h-[85%] w-72 overflow-hidden rounded-2xl border border-separator bg-bg-3 p-3">
            <Text className="mb-2 border-b border-separator px-2 pb-2 text-xl font-bold text-text-1">
              {placeholder.charAt(0).toUpperCase() + placeholder.slice(1)}
            </Text>

            <FlatList
              showsVerticalScrollIndicator
              data={options}
              keyExtractor={(item, index) => `${getValue(item)}-${index}`}
              renderItem={({ item, index }) => {
                const itemLabel = getLabel(item);
                const itemValue = getValue(item);
                return (
                  <TouchableOpacity
                    className={`flex-row items-center justify-between px-2 py-3 ${
                      index < options.length - 1 ? 'border-b border-separator' : ''
                    }`}
                    onPress={() => handleSelect(item)}>
                    <Text className="text-lg text-text-2">{itemLabel}</Text>
                    {value === itemValue && (
                      <Text className="text-sm font-bold text-red-600">ACTIVE</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </BlurView>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ModalDropdown;
