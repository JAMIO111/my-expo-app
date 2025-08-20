import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import CTAButton from './CTAButton';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ConfirmModal = ({
  visible,
  title,
  message,
  onCancel,
  topButtonText = 'Cancel',
  bottomButtonText = 'Accept',
  topButtonType = 'error',
  bottomButtonType = 'success',
  topButtonFn = () => {},
  bottomButtonFn = () => {},
}) => {
  const [showModal, setShowModal] = useState(visible);

  const fadeAnim = useRef(new Animated.Value(0)).current; // for backdrop
  const slideAnim = useRef(new Animated.Value(300)).current; // for modal (start off-screen)

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.5, // target opacity
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, // move to final position
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }
  }, [visible]);

  if (!showModal) return null;

  return (
    <Modal transparent animationType="none" visible={showModal} onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-end">
        {/* Animated dimmed background */}
        <TouchableWithoutFeedback onPress={onCancel}>
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'black',
              opacity: fadeAnim,
            }}
          />
        </TouchableWithoutFeedback>

        {/* Animated bottom card */}
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            width: '100%',
            alignItems: 'center',
            paddingBottom: 20,
          }}>
          <View style={{ borderRadius: 40 }} className="w-[90%] bg-white p-8 shadow-md">
            <View className="mb-4 w-full flex-row items-start justify-between">
              <Text className="font-saira-semibold text-3xl text-text-1">{title}</Text>
              <Ionicons name="close" size={26} color="black" onPress={onCancel} />
            </View>
            <Text className="mb-8 font-saira text-xl text-text-2">{message}</Text>

            <View className="mb-4 w-full">
              <CTAButton text={topButtonText} type={topButtonType} callbackFn={topButtonFn} />
            </View>
            <View className="w-full">
              <CTAButton
                text={bottomButtonText}
                type={bottomButtonType}
                callbackFn={bottomButtonFn}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
