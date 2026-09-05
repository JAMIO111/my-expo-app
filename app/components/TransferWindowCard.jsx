import { useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { ArrowRight, ArrowRightLeft } from 'lucide-react-native';
import LivePulseCard from './LivePulseCard';

const TransferWindowCard = ({ onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
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
      className="rounded-3xl border bg-theme-yellow shadow-sm"
      style={{
        borderWidth: 4,
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
      }}>
      <View className="p-3">
        <View className="flex-row justify-between">
          <View className="flex-1 pr-4">
            <View className="mb-6 w-32">
              <LivePulseCard showBG={false} dotSize={12} text="LIVE EVENT" />
            </View>

            <Text className="pl-2 pt-2 font-tektur-semibold text-3xl leading-8 text-text-1">
              Transfer Window{'\n'}Now Open
            </Text>
          </View>

          <View className="h-12 w-12 items-center justify-center rounded-2xl border bg-black">
            <ArrowRightLeft size={28} color="#FFD700" />
          </View>
        </View>

        <Text className="mt-4 pl-2 font-tektur text-base text-text-1">
          Reshape your squad or look for a move before the next season starts.
        </Text>

        {/* Animated CTA Only */}
        <Animated.View
          style={{
            transform: [{ scale }],
          }}
          className="mt-4">
          <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            className="flex-row items-center justify-between rounded-2xl bg-black p-4">
            <Text className="font-tektur-semibold text-lg text-theme-yellow">
              Go to transfer market
            </Text>
            <View className="h-8 w-8 items-center justify-center rounded-full">
              <ArrowRight size={24} color="#FFD700" />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

export default TransferWindowCard;
