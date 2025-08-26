import { View, Text, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import IonIcons from 'react-native-vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';

const ConfirmModal = ({
  visible,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  type = 'default',
}) => {
  let backgroundColor;
  switch (type) {
    case 'confirm':
      backgroundColor = 'bg-theme-green';
      break;
    case 'cancel':
      backgroundColor = 'bg-theme-red';
      break;
    case 'warning':
      backgroundColor = 'bg-theme-yellow';
      break;
    case 'info':
      backgroundColor = 'bg-theme-blue';
      break;
    default:
      backgroundColor = 'bg-theme-gray';
  }
  return (
    <Modal isVisible={visible}>
      <View className="relative rounded-3xl border border-theme-gray-3 bg-background-light p-6 pt-6">
        {/* Close button inside modal box */}
        <TouchableOpacity
          className="bg-white"
          onPress={onCancel}
          style={{
            position: 'absolute',
            top: 20,
            right: 15,
            zIndex: 10,
          }}>
          <IonIcons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="mb-3 w-full pl-2 text-left font-saira-semibold text-3xl text-text-1">
            {title}
          </Text>
          <Text className="mb-6 w-full pl-2 text-left font-saira text-xl text-text-2">
            {message}
          </Text>

          <View className="flex-row gap-5">
            <View className="flex-1">
              <CTAButton text="Cancel" type="default" callbackFn={onCancel} />
            </View>
            <View className="flex-1">
              <CTAButton text="Confirm" type={type} callbackFn={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
