import { View, Text, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import IonIcons from 'react-native-vector-icons/Ionicons';

const ConfirmModal = ({
  visible,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
}) => {
  return (
    <Modal isVisible={visible}>
      <View className="relative rounded-2xl bg-background-light p-6 pt-10">
        {/* Close button inside modal box */}
        <TouchableOpacity
          onPress={onCancel}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
          }}>
          <IonIcons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-text-1 mb-2 text-2xl font-bold">{title}</Text>
          <Text className="text-text-2 mb-6 text-center text-xl">{message}</Text>

          <View className="flex-row gap-5">
            <TouchableOpacity
              onPress={onCancel}
              className="w-1/2 items-center justify-center rounded-lg bg-gray-300 py-2">
              <Text className="text-2xl text-black">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className="w-1/2 items-center justify-center rounded-lg bg-red-600 py-3">
              <Text className="text-2xl text-white">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
