import { StyleSheet, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DropdownFilterButton = ({ text, callbackFn }) => {
  return (
    <Pressable
      onPress={callbackFn}
      className="flex-1 flex-row items-center rounded-xl border border-brand-light bg-brand px-2 py-2">
      <Text className=" flex-1 text-center text-lg text-white">{text}</Text>
      <Ionicons name="chevron-down" size={20} color="white" />
    </Pressable>
  );
};

export default DropdownFilterButton;

const styles = StyleSheet.create({});
