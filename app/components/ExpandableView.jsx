import { useEffect, useRef } from 'react';
import { Text, View, Pressable, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Heading from './Heading';

const ExpandableView = ({ title, show, setShow, children }) => {
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
    <View>
      <Pressable
        className="flex-row items-center justify-between py-2 pr-6"
        onPress={() => setShow(!show)}>
        <Heading text={title} />
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={30} />
        </Animated.View>
      </Pressable>

      {show && <View className="pt-2">{children}</View>}
    </View>
  );
};

export default ExpandableView;
