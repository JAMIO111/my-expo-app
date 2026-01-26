import { Pressable, Text, Animated, useColorScheme, ActivityIndicator, View } from 'react-native';
import { useRef } from 'react';
import colors from '@lib/colors';

const CTAButton = ({
  type = 'default',
  text,
  icon,
  iconColor = 'white',
  callbackFn,
  disabled,
  loading = false,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const buttonTheme = themeColors[type] || themeColors.default;
  const hasNavigated = useRef(false);

  const scale = useRef(new Animated.Value(1)).current;

  const handleCallbackFn = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    setTimeout(() => {
      hasNavigated.current = false;
    }, 750);
    callbackFn();
  };

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
        onPress={handleCallbackFn}
        disabled={disabled || loading}
        className="w-full items-center justify-center border border-border-color p-3"
        style={{
          backgroundColor: buttonTheme.primary,
          borderColor: buttonTheme.secondary,
          opacity: disabled || loading ? 0.6 : 1,
          borderRadius: 16,
        }}>
        {loading ? (
          <View className="flex-row items-center justify-center gap-3">
            <ActivityIndicator size="small" color={iconColor} />
            <Text style={{ color: buttonTheme.text }} className={`pt-1 font-saira text-xl`}>
              {text}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-center gap-3">
            {icon && icon}
            <Text style={{ color: buttonTheme.text }} className={`pt-1 font-saira text-xl`}>
              {text}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default CTAButton;
