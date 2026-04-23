import { useRef, useState } from 'react';
import { View, Text, Pressable, Animated, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RefreshSpinner from './RefreshSpinner'; // Adjust path as needed
import colors from '@lib/colors';
import FloatingBottomSheet from './FloatingBottomSheet';

const SeasonControlCard = ({ activeSeason, onStart, onEnd, loading }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const isOpen = !!activeSeason;
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const openConfirmModal = () => {
    const action = isOpen ? 'end' : 'start';

    setModalConfig({
      action,
      title: isOpen ? 'End Season?' : 'Start New Season?',
      message: isOpen
        ? 'This will close the current season and stop all fixtures.'
        : 'This will start a new season and enable league activity.',
      confirmText: isOpen ? 'End Season' : 'Start Season',
      confirmType: isOpen ? 'error' : 'success',
    });

    setModalVisible(true);
  };

  const handleConfirm = async () => {
    try {
      if (modalConfig.action === 'end') {
        await onEnd(activeSeason.id);
      } else {
        await onStart();
      }
    } finally {
      setModalVisible(false);
    }
  };

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const statusColor = isOpen ? themeColors.success.primary : themeColors.error.primary;

  return (
    <>
      <View style={{ borderRadius: 24 }} className="bg-bg-2 p-2 shadow-sm">
        <View className="rounded-3xl bg-bg-1 shadow-sm">
          <View className="p-3">
            <View className="flex-row justify-between">
              <View className="flex-1 pr-4">
                {/* Status Badge */}
                <View className="mb-4 flex flex-row items-center justify-start gap-2 py-1 pl-2">
                  <View
                    style={{ backgroundColor: statusColor }}
                    className={`${isOpen ? 'animate-pulse' : ''} h-3 w-3 rounded-full`}
                  />
                  <Text className="font-saira-bold text-[10px] uppercase tracking-widest text-black">
                    {isOpen ? 'Season Active' : 'Off-Season'}
                  </Text>
                </View>

                <Text className="pl-2 pt-2 font-saira-bold text-3xl leading-8 text-black">
                  {isOpen ? activeSeason.name : `Start New Season`}
                </Text>
              </View>

              {/* Status Icon Container */}
              <View
                className={`h-14 w-14 items-center justify-center rounded-2xl border ${isOpen ? 'bg-brand' : 'bg-gray-800'}`}>
                <Ionicons
                  name={isOpen ? 'calendar' : 'calendar-outline'}
                  size={28}
                  color={isOpen ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </View>

            <Text className="mt-2 pl-2 font-saira text-base text-black/80">
              {isOpen
                ? 'Currently managing fixtures and teams.'
                : 'No active season. Start one to begin league operations.'}
            </Text>

            {/* Action Button */}
            <Animated.View style={{ transform: [{ scale }] }} className="mt-4">
              <Pressable
                onPress={openConfirmModal}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={loading}
                style={{
                  backgroundColor: isOpen ? themeColors.error.primary : themeColors.success.primary,
                  borderColor: isOpen ? themeColors.error.secondary : themeColors.success.secondary,
                }}
                className={`flex-row items-center justify-between rounded-2xl border p-4`}>
                <Text className={`font-saira-bold text-lg ${isOpen ? 'text-white' : 'text-white'}`}>
                  {loading ? 'Processing...' : isOpen ? 'End Current Season' : 'Start New Season'}
                </Text>

                <View
                  style={{
                    backgroundColor: isOpen ? '#ffffff' : themeColors.success.secondary,
                  }}
                  className={`h-8 w-8 items-center justify-center rounded-full`}>
                  {loading ? (
                    <RefreshSpinner
                      refreshing={loading}
                      size={20}
                      color={isOpen ? themeColors.error.primary : '#ffffff'}
                    />
                  ) : (
                    <Ionicons
                      name={isOpen ? 'stop' : 'play'}
                      size={20}
                      color={isOpen ? themeColors.error.primary : '#ffffff'}
                    />
                  )}
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>
      <FloatingBottomSheet
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        title={modalConfig?.title}
        message={modalConfig?.message}
        topButtonText="Cancel"
        topButtonType="default"
        topButtonFn={() => setModalVisible(false)}
        bottomButtonText={modalConfig?.confirmText}
        bottomButtonType={modalConfig?.confirmType}
        bottomButtonFn={handleConfirm}
        onAnimationEnd={() => {
          if (!modalVisible) setModalConfig(null);
        }}
      />
    </>
  );
};

export default SeasonControlCard;
