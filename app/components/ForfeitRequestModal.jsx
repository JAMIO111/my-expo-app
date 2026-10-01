import { KeyboardAvoidingView, KeyboardProvider } from 'react-native-keyboard-controller';
import { View, Text, Modal } from 'react-native';
import { useState } from 'react';
import CustomTextInput from './CustomTextInput';
import { Ionicons } from '@expo/vector-icons';
import CTAButton from './CTAButton';
import SlidingTabButton from './SlidingTabButton';
import { useUser } from '@contexts/UserProvider';

const ForfeitRequestModal = ({ visible, onCancel, onConfirm, loading = false }) => {
  // SlidingTabButton speaks 'left' | 'right'; the forfeit_fixture RPC wants 'home' | 'away'.
  const [tab, setTab] = useState('left');
  const [reason, setReason] = useState('');
  const { currentRole } = useUser();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}>
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 items-center justify-center bg-black/80 px-6">
          <View className="w-full rounded-3xl bg-bg-grouped-2 p-6 shadow-lg">
            {/* Icon */}
            <View className="mb-4 items-center">
              <View className="rounded-full bg-theme-red/20 p-4">
                <Ionicons name="alert-circle-outline" size={40} color="red" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-center font-saira-bold text-2xl text-text-1">
              Request Forfeit?
            </Text>

            {/* Description */}
            <Text className="py-4 text-center font-saira text-base text-text-2">
              {currentRole?.role === 'admin'
                ? 'Select the side that is forfeiting then enter a reason for the forfeit for traceability.'
                : 'Are you sure you want to request a forfeit for this fixture? If it is your team forfeiting then it will be an automatic loss, if it is the other team then they will have to respond to the request.'}
            </Text>
            <View className="mb-4">
              <Text className="pl-2 font-saira-medium text-xl text-text-1">Forfeit Side</Text>
              <SlidingTabButton option1="Home" option2="Away" onChange={setTab} value={tab} />
            </View>

            <CustomTextInput
              placeholder="e.g. Opponent didn't show up."
              multiline
              value={reason}
              onChangeText={setReason}
              title="Reason for Forfeit Request"
              titleColor="text-text-1"
              numberOfLines={3}
              leftIconName="chatbubble-ellipses-outline"
              leftIconSize={20}
              iconColor="#8B5CF6"
            />

            {/* Buttons */}
            <View className="mt-6 gap-3">
              <CTAButton
                text={loading ? 'Requesting...' : 'Request Forfeit'}
                type="error"
                disabled={loading}
                callbackFn={() =>
                  onConfirm({ side: tab === 'left' ? 'home' : 'away', reason: reason.trim() })
                }
              />

              <CTAButton text="Cancel" type="default" callbackFn={onCancel} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </KeyboardProvider>
    </Modal>
  );
};

export default ForfeitRequestModal;
