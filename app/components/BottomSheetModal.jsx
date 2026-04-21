import { View, Text, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomSheetModal = ({ showModal, setShowModal, title, children }) => {
  return (
    <Modal
      visible={showModal}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={() => setShowModal(false)}>
      <View className="relative w-full flex-1 items-stretch justify-between pb-8">
        <View className="items-center gap-2 bg-brand p-4">
          <View className="h-1 w-12 rounded-full bg-gray-400" />
          <View className="flex-row items-center py-2">
            <Text className="flex-1 pt-2 font-saira-medium text-2xl text-text-on-brand">
              {title}
            </Text>
            <Pressable
              className="rounded-full bg-brand-light p-1"
              onPress={() => setShowModal(false)}
              hitSlop={10}>
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>
        </View>
        {children}
      </View>
    </Modal>
  );
};

export default BottomSheetModal;
