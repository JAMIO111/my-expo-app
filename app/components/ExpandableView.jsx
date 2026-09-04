import { useEffect, useRef } from 'react';
import { Text, View, Pressable, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Heading from './Heading';

const ExpandableView = ({
  title,
  show,
  setShow,
  fixedOpen = false,
  fixedClosed = false,
  fixedClosedComponent = null,
  notificationCount,
  children,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: show && !fixedClosed ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [show, fixedClosed]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View className="rounded-2xl border border-theme-gray-5 bg-bg-1 p-3">
      <Pressable
        className="flex-row items-center justify-between p-1"
        onPress={() => !fixedOpen && !fixedClosed && setShow(!show)}>
        <View className="flex-row items-center gap-3">
          <Heading text={title} />
          {notificationCount > 0 && (
            <View
              style={{ height: 22, width: 22 }}
              className="items-center justify-center rounded-full bg-theme-red/75 shadow-sm">
              <Text style={{ fontSize: 12 }} className="font-tektur-medium text-white">
                {notificationCount}
              </Text>
            </View>
          )}
        </View>
        {!fixedOpen && !fixedClosed && (
          <Animated.View style={{ transform: [{ rotate }], marginRight: 4 }}>
            <Ionicons color="#666" name="chevron-down" size={30} />
          </Animated.View>
        )}
        {fixedClosed && fixedClosedComponent}
      </Pressable>

      {(show || fixedOpen) && !fixedClosed && <View className="pt-5">{children}</View>}
    </View>
  );
};

export default ExpandableView;
