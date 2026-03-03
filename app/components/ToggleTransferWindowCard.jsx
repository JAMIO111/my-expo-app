import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RefreshSpinner from './RefreshSpinner';

const AdminTransferToggle = ({ isOpen, onToggle, loading }) => {
  const scale = useRef(new Animated.Value(1)).current;

  // Animation for the button press
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

  // Define colors based on the state
  const gradientColors = isOpen ? ['#063d12', '#0e7123'] : ['#1f2937', '#111827'];
  const statusColor = isOpen ? '#22c55e' : '#ef4444'; // Green vs Red dot

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
                <View style={{ backgroundColor: statusColor }} className="h-3 w-3 rounded-full" />
                <Text className="font-saira-bold text-[10px] uppercase tracking-widest text-white">
                  {isOpen ? 'Window Active' : 'Window Closed'}
                </Text>
              </View>

              <Text className="pl-2 pt-2 font-saira-bold text-3xl leading-8 text-white">
                Admin{'\n'}Controls
              </Text>
            </View>

            {/* Status Icon Container */}
            <View
              className={`h-14 w-14 items-center justify-center rounded-2xl border ${isOpen ? 'bg-white' : 'bg-gray-800'}`}>
              <Ionicons
                name={isOpen ? 'lock-open' : 'lock-closed'}
                size={28}
                color={isOpen ? '#063d12' : '#9ca3af'}
              />
            </View>
          </View>

          <Text className="mt-4 pl-2 font-saira text-base text-white/80">
            {isOpen
              ? 'The transfer market is currently open.'
              : 'The market is hidden. Players cannot make moves.'}
          </Text>

          {/* Toggle Button */}
          <Animated.View style={{ transform: [{ scale }] }} className="mt-6">
            <Pressable
              onPress={onToggle}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={loading}
              className={`flex-row items-center justify-between rounded-2xl p-4 ${isOpen ? 'bg-white' : 'bg-red-500'}`}>
              <Text className={`font-saira-bold text-lg ${isOpen ? 'text-black' : 'text-white'}`}>
                {loading ? 'Loading...' : isOpen ? 'Close Transfer Window' : 'Open Transfer Window'}
              </Text>

              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${isOpen ? 'bg-gray-100' : 'bg-red-600'}`}>
                {loading ? (
                  <RefreshSpinner
                    refreshing={loading}
                    size={20}
                    color={isOpen ? '#ef4444' : '#ffffff'}
                  />
                ) : (
                  <Ionicons
                    name={isOpen ? 'power' : 'play'}
                    size={20}
                    color={isOpen ? '#ef4444' : '#ffffff'}
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

export default AdminTransferToggle;
