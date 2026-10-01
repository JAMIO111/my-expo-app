import { forwardRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

// Large, high-contrast text field for the dark onboarding sheet. Highlights when focused, has a clear
// button, and passes returnKeyType / onSubmitEditing through so the keyboard's own key can move on.
const OnboardingInput = forwardRef(
  ({ label, icon, value, onChangeText, delay = 0, hint, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <Animated.View entering={FadeInDown.delay(delay).duration(380)}>
        <Text className="mb-2 pl-1 font-saira-semibold text-xs uppercase tracking-[2px] text-text-on-brand-2">
          {label}
        </Text>
        <View
          className={`h-16 flex-row items-center rounded-2xl border-2 px-4 ${
            focused ? 'border-white bg-white/15' : 'border-white/15 bg-white/10'
          }`}>
          {icon ? (
            <Ionicons name={icon} size={22} color={focused ? '#FFFFFF' : '#FFFFFF99'} />
          ) : null}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholderTextColor="#FFFFFF55"
            selectionColor="#FBBF24"
            className="ml-3 flex-1 font-saira text-xl text-white"
            style={{ lineHeight: 28 }}
            {...rest}
          />
          {value ? (
            <Pressable hitSlop={10} onPress={() => onChangeText?.('')}>
              <Ionicons name="close-circle" size={20} color="#FFFFFF77" />
            </Pressable>
          ) : null}
        </View>
        {hint ? <Text className="mt-2 pl-1 font-saira text-sm text-text-on-brand-2">{hint}</Text> : null}
      </Animated.View>
    );
  }
);

export default OnboardingInput;
