import { Pressable, Text, Animated } from 'react-native';
import { useRef } from 'react';
import colors from '@lib/colors';
import { useColorScheme } from 'nativewind';

const CTAButton = ({ type = 'brand', text, icon, callbackFn, disabled }) => {
  const { colorScheme } = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const buttonTheme = themeColors[type] || themeColors.brand;

  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={callbackFn}
        disabled={disabled}
        className="h-16 w-full items-center justify-center rounded-2xl border border-border-color"
        style={{
          backgroundColor: buttonTheme.primary,
          borderColor: buttonTheme.secondary,
        }}>
        {icon && <View className="absolute left-4">{icon}</View>}
        <Text className="text-xl font-bold text-white">{text}</Text>
      </Pressable>
    </Animated.View>
  );
};

export default CTAButton;
