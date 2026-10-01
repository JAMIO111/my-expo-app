import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

// A big selectable (or tappable) card for the onboarding sheet. `selected` shows the tick state; leave it
// undefined for cards that just navigate (then a chevron is shown instead).
export default function ChoiceCard({
  title,
  subtitle,
  icon,
  iconColor = '#8B5CF6',
  selected,
  disabled = false,
  delay = 0,
  onPress,
  right,
}) {
  const selectable = selected !== undefined;
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(380)}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={{ opacity: disabled ? 0.45 : 1 }}
        className={`flex-row items-center gap-4 rounded-3xl border-2 p-4 ${
          selected ? 'border-white bg-white/20' : 'border-white/15 bg-white/10'
        }`}>
        {icon ? (
          <View
            className="h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: iconColor }}>
            <Ionicons name={icon} size={28} color="white" />
          </View>
        ) : null}
        <View className="flex-1">
          <Text className="font-saira-semibold text-xl text-text-on-brand">{title}</Text>
          {subtitle ? (
            <Text className="mt-0.5 font-saira text-base text-text-on-brand-2">{subtitle}</Text>
          ) : null}
        </View>
        {right ??
          (selectable ? (
            <View
              className={`h-8 w-8 items-center justify-center rounded-full border-2 ${
                selected ? 'border-white bg-white' : 'border-white/40'
              }`}>
              {selected ? <Ionicons name="checkmark" size={20} color="#111" /> : null}
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={22} color="#FFFFFF88" />
          ))}
      </Pressable>
    </Animated.View>
  );
}
