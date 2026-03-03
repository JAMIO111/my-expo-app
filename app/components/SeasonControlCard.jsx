import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RefreshSpinner from './RefreshSpinner'; // Adjust path as needed
import colors from '@lib/colors';

const SeasonControlCard = ({ activeSeason, onStart, onEnd, loading }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const isOpen = !activeSeason;
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined

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

  // Matching the AdminTransferToggle color logic
  const gradientColors = isOpen ? ['#dbdbdb', '#FFFFFF'] : ['#FFFFFF', '#FFFFFF'];
  const statusColor = isOpen ? themeColors.success.primary : themeColors.error.primary;

  const handlePress = () => {
    if (isOpen) {
      onEnd(activeSeason.id);
    } else {
      onStart();
    }
  };

  return (
    <View
      className="overflow-hidden rounded-3xl border border-theme-gray-3 shadow-sm"
      style={{
        shadowColor: isOpen ? '#063d12' : '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
      }}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
              onPress={handlePress}
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
      </LinearGradient>
    </View>
  );
};

export default SeasonControlCard;
