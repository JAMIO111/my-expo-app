import { View, Text, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ghost, Loader } from 'lucide-react-native';

const EmptyStateCard = ({
  title = 'Opps, nothing to see here.',
  message = 'There are no items to display.',
  icon: IconComponent,
  backgroundColor = 'bg-bg-2',
  loading = false,
}) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation;

    if (loading) {
      spin.setValue(0);
      animation = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    }

    return () => {
      animation?.stop();
    };
  }, [loading]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className={`items-center justify-center rounded-3xl ${backgroundColor} p-10 shadow-sm`}>
      {loading ? (
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Loader size={40} color="#666" />
        </Animated.View>
      ) : IconComponent ? (
        <IconComponent size={48} color="#666" />
      ) : (
        <Ghost size={48} color="#777" />
      )}
      <Text className="pt-6 text-center font-tektur-medium text-xl text-text-1">{title}</Text>
      <Text className="mt-4 text-center font-tektur text-sm text-text-2">{message}</Text>
    </View>
  );
};

export default EmptyStateCard;
