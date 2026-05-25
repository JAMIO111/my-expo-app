import { View, Text, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomSheetModal = ({ showModal, setShowModal, title, children }) => {
  return (
    <Modal
      visible={showModal}
      presentationStyle="pageSheet"
      animationType="slide"
      transparent={false}
      statusBarTranslucent={false}
      hardwareAccelerated
      onRequestClose={() => setShowModal(false)}>
      <View className="bg-bg flex-1">
        {/* HEADER */}
        <View className="items-center gap-2 bg-brand px-4 pb-4 pt-3">
          <View className="h-1 w-12 rounded-full bg-gray-400" />

          <View className="flex-row items-center">
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

        {/* CONTENT */}
        <View className="flex-1">{children}</View>
      </View>
    </Modal>
  );
};

export default BottomSheetModal;
