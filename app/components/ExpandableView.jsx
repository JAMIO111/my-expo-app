import { useEffect, useRef } from 'react';
import { Text, View, Pressable, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Heading from './Heading';

const ExpandableView = ({ title, show, setShow, notificationCount, children }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: show ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [show]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View className="bg-bg-1 p-3">
      <Pressable
        className="flex-row items-center justify-between py-2 pr-6"
        onPress={() => setShow(!show)}>
        <View className="flex-row items-center gap-3">
          <Heading text={title} />
          {notificationCount > 0 && (
            <View
              style={{ height: 26, width: 26, marginBottom: 4 }}
              className="items-center justify-center rounded-full border border-theme-red bg-theme-red/80 shadow-sm">
              <Text className="font-saira-semibold text-white">{notificationCount}</Text>
            </View>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={30} />
        </Animated.View>
      </Pressable>

      {show && <View className="pt-2">{children}</View>}
    </View>
  );
};

export default ExpandableView;
