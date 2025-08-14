import { Pressable, Text, Animated, useColorScheme, ActivityIndicator, View } from 'react-native';
import { useRef } from 'react';
import colors from '@lib/colors';

const CTAButton = ({ type = 'brand', text, icon, callbackFn, disabled, loading = false }) => {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const buttonTheme = themeColors[type] || themeColors.default;

  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 30,
        bounciness: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 10,
      }).start();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={callbackFn}
        disabled={disabled || loading}
        className="h-16 w-full items-center justify-center rounded-2xl border border-border-color"
        style={{
          backgroundColor: buttonTheme.primary,
          borderColor: buttonTheme.secondary,
          opacity: disabled || loading ? 0.6 : 1,
        }}>
        {loading ? (
          <View className="flex-row items-center justify-center gap-3">
            <ActivityIndicator size="small" color="#ffffff" />
            <Text className="pt-1 font-saira text-2xl text-white">{text}</Text>
          </View>
        ) : (
          <>
            {icon && <View className="absolute left-4">{icon}</View>}
            <Text className="pt-1 font-saira text-2xl text-white">{text}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default CTAButton;
