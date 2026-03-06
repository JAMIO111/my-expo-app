import { StyleSheet, Text, View, Pressable } from 'react-native';
import '../../global.css';
import Ionicons from 'react-native-vector-icons/Ionicons';

const StatCard = ({
  title,
  value,
  icon,
  iconBgColor = 'bg-gray-500',
  backgroundColor = 'bg-bg-grouped-3',
  onPress,
  disabled = true,
}) => {
  // format value if the title ends with %
  const displayValue =
    title.endsWith('%') && typeof value === 'number' ? `${value.toFixed(1)}%` : value;

  const Content = (
    <View
      className={`relative flex-1 flex-row items-center overflow-hidden rounded-2xl border-0 border-brand-light ${backgroundColor} shadow-[0_2px_4px_rgba(0,0,0,0.1)]`}>
      <View className="h-full w-0 bg-brand-light" />

      <View className="flex-1 px-4 pt-2">
        <Text className="pt-4 font-saira-semibold text-5xl text-text-1">{displayValue}</Text>
        <View className="flex-row items-center gap-3">
          {icon && (
            <View className={`${iconBgColor} rounded-lg p-1`}>
              <Ionicons name={icon} size={24} color="#fff" />
            </View>
          )}
          <Text
            className="pb-4 font-saira text-lg text-text-2"
            numberOfLines={1}
            ellipsizeMode="tail">
            {title}
          </Text>
        </View>
      </View>
      {!disabled && (
        <Ionicons name="sync-outline" size={20} className="absolute right-3 top-3 text-text-2" />
      )}
    </View>
  );

  if (disabled || !onPress) {
    return Content;
  }

  return (
    <Pressable className="flex-1" onPress={onPress}>
      {Content}
    </Pressable>
  );
};

export default StatCard;
