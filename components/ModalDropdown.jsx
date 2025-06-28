import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ModalDropdown = ({ options, placeholder, value, onChange }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (option) => {
    onChange(option);
    setModalVisible(false);
  };

  return (
    <View className="flex-1">
      <Pressable
        className="bg-input-background border-border-color flex-row items-center justify-between rounded-md border px-3 py-3"
        onPress={() => setModalVisible(true)}>
        <Text className={value ? 'text-text-primary' : 'text-text-secondary'}>
          {value || `Select a ${placeholder}`}
        </Text>
        <View className="ml-2 flex-col items-center justify-center">
          <Ionicons name="caret-up" size={12} color="#9CA3AF" />
          <Ionicons name="caret-down" size={12} color="#9CA3AF" />
        </View>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setModalVisible(false)}>
          <View className="bg-background-light border-border-color max-h-[80%] w-72 rounded-xl border p-3 shadow-lg">
            <Text className="text-text-primary border-border-color mb-2 border-b pb-2 text-lg font-bold">
              {placeholder.charAt(0).toUpperCase() + placeholder.slice(1)}
            </Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="border-border-color flex-row items-center justify-between border-b px-2 py-3"
                  onPress={() => handleSelect(item)}>
                  <Text className="text-text-secondary text-base">{item}</Text>
                  {value === item && <Text className="text-xs font-bold text-red-600">ACTIVE</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ModalDropdown;
