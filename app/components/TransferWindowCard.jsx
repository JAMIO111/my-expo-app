import React, { useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TransferWindowCard = ({ onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

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

  return (
    <View
      className="overflow-hidden rounded-3xl border border-theme-gray-3 bg-theme-purple shadow-sm"
      style={{
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
      }}>
      <LinearGradient colors={['#063d12', '#0e7123']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View className="p-3">
          <View className="flex-row justify-between">
            <View className="flex-1 pr-4">
              <View className="mb-4 flex flex-row items-center justify-start gap-2 py-1 pl-2">
                <View className="h-3 w-3 rounded-full bg-theme-red" />
                <Text className="font-saira-bold text-[10px] uppercase tracking-widest text-white">
                  Live Event
                </Text>
              </View>

              <Text className="pl-2 font-saira-bold text-3xl leading-8 text-white">
                Transfer Window{'\n'}Now Open
              </Text>
            </View>

            <View className="h-14 w-14 items-center justify-center rounded-2xl border bg-white">
              <Ionicons name="swap-horizontal" size={32} color="#063d12" />
            </View>
          </View>

          <Text className="mt-4 pl-2 font-saira text-base text-white">
            Reshape your squad before the next season starts.
          </Text>

          {/* Animated CTA Only */}
          <Animated.View
            style={{
              transform: [{ scale }],
            }}
            className="mt-6">
            <Pressable
              onPress={onPress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              className="flex-row items-center justify-between rounded-2xl bg-white p-4">
              <Text className="font-saira-bold text-lg text-black">Go to transfer market</Text>
              <View className="h-8 w-8 items-center justify-center rounded-full">
                <Ionicons name="arrow-forward" size={20} color="#063d12" />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default TransferWindowCard;
