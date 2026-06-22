import { Text, View, Image, Pressable, Animated } from 'react-native';
import { useRef } from 'react';

const HomeScreenCardLarge = ({ title, body, category, image, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const hasNavigated = useRef(false);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  const resetScale = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={resetScale}
        onPress={() => {
          if (hasNavigated.current) return;
          hasNavigated.current = true;
          setTimeout(() => {
            hasNavigated.current = false;
          }, 500);
          onPress?.();
          resetScale(); // 👈 THIS is the key fix
        }}
        className="w-full items-center justify-between rounded-3xl bg-bg-1 p-1 shadow-md">
        <Image
          source={image}
          style={{
            resizeMode: 'cover',
            height: 220,
            width: '100%',
            borderRadius: 18,
          }}
        />

        <View className="w-full items-center justify-center gap-1 p-4">
          <Text className="mb-2 w-full text-left font-saira-semibold text-2xl text-text-1">
            {title}
          </Text>
          <Text className="w-full text-left font-saira-regular text-text-2">{body}</Text>
          <Text className="w-full text-left font-saira-regular text-text-3">{category}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default HomeScreenCardLarge;
