import { View, Text, Switch } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ToggleCard({ title, description, icon, value, onValueChange, delay = 0 }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      className="rounded-3xl border-2 border-white/15 bg-white/10 p-4">
      <View className="flex-row items-center gap-4">
        {icon ? <Ionicons name={icon} size={26} color="#FFFFFFCC" /> : null}
        <Text className="flex-1 font-saira-semibold text-xl text-text-on-brand">{title}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          thumbColor="white"
          trackColor={{ false: '#6B7280', true: '#4CAF50' }}
        />
      </View>
      {description ? (
        <Text className="mt-3 font-saira text-base leading-5 text-text-on-brand-2">{description}</Text>
      ) : null}
    </Animated.View>
  );
}
