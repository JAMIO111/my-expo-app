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
          <Text className="mb-4 text-3xl font-bold text-text-1">{title}</Text>
          <Text className="mb-6 text-center text-xl text-text-2">{message}</Text>

          <View className="flex-row gap-5">
            <TouchableOpacity
              onPress={onCancel}
              className="bg-theme-gray-5 w-1/2 items-center justify-center rounded-lg py-2">
              <Text className="text-2xl text-text-1">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className="w-1/2 items-center justify-center rounded-lg bg-theme-red py-3">
              <Text className="text-2xl text-white">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
