import { Animated, Easing } from 'react-native';
import { Loader } from 'lucide-react-native';
import { useEffect, useRef } from 'react';

const RotatingLoader = ({ size = 32, color = '#666' }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1700,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Loader size={size} color={color} />
    </Animated.View>
  );
};

export default RotatingLoader;
