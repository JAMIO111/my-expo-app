import { View, Text, Modal, Pressable, Platform } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BottomSheetModal = ({ showModal, setShowModal, title, children }) => {
  const insets = useSafeAreaInsets();
  // On Android the modal is edge-to-edge (needed for keyboard handling), so the
  // system bars have to be padded for manually; iOS pageSheet handles its own.
  const topInset = Platform.OS === 'android' ? insets.top : 0;
  const bottomInset = Platform.OS === 'android' ? insets.bottom : 0;

  return (
    <Modal
      visible={showModal}
      presentationStyle="pageSheet"
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      onRequestClose={() => setShowModal(false)}>
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <View className="flex-1 bg-bg-2" style={{ paddingBottom: bottomInset }}>
          {/* HEADER */}
          <View
            className="items-center gap-2 bg-brand px-4 pb-4 pt-3"
            style={{ paddingTop: 12 + topInset }}>
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
      </KeyboardProvider>
    </Modal>
  );
};

export default BottomSheetModal;
