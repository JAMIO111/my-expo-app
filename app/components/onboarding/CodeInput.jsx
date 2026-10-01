import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// One real (hidden) text field holds the whole code; the boxes only display it. That makes typing,
// deleting, pasting and SMS / password-manager autofill all behave naturally, with no focus juggling
// between six separate inputs. The active box pulses so it's clear where the next digit goes.
const CodeInput = forwardRef(({ value, onChange, length = 6, disabled = false, error = false }, ref) => {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);
  const pulse = useSharedValue(1);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    shake: () => {
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withRepeat(withTiming(10, { duration: 90 }), 5, true),
        withTiming(0, { duration: 50 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  }));

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.35, { duration: 520 }), -1, true);
  }, [pulse]);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const caretStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const handleChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    if (digits.length !== value.length) {
      Haptics.selectionAsync().catch(() => {});
    }
    onChange(digits);
  };

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View>
      <Animated.View style={rowStyle} className="flex-row justify-between gap-2">
        {Array.from({ length }).map((_, i) => {
          const char = value[i] || '';
          const isActive = focused && !disabled && i === activeIndex && value.length < length;
          const filled = !!char;
          return (
            <Pressable
              key={i}
              onPress={() => inputRef.current?.focus()}
              className={`h-16 flex-1 items-center justify-center rounded-2xl border-2 ${
                error
                  ? 'border-red-400 bg-red-400/10'
                  : isActive
                    ? 'border-white bg-white/20'
                    : filled
                      ? 'border-white/60 bg-white/15'
                      : 'border-white/15 bg-white/10'
              }`}>
              {char ? (
                <Text className="font-saira-bold text-3xl text-white">{char}</Text>
              ) : isActive ? (
                <Animated.View style={caretStyle} className="h-7 w-0.5 rounded-full bg-white" />
              ) : null}
            </Pressable>
          );
        })}
      </Animated.View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={length}
        autoFocus
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        caretHidden
        contextMenuHidden={false}
        // invisible, but covering the boxes so a tap anywhere or a long-press paste reaches it
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.015, color: 'transparent' }}
      />
    </View>
  );
});

export default CodeInput;
