import { Text, View, Pressable, ActivityIndicator } from 'react-native';
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
  isLoading = false,
}) => {
  const displayValue =
    !isLoading && title?.endsWith('%') && typeof value === 'number'
      ? `${value.toFixed(1)}%`
      : value;

  const Skeleton = ({ width, height, className }) => (
    <View
      style={{ width, height }}
      className={`animate-pulse rounded-md bg-theme-gray-4 ${className}`}
    />
  );

  const Content = (
    <View
      className={`relative flex-1 flex-row items-center rounded-2xl p-1 shadow-sm ${backgroundColor}`}>
      {/* TOP RIGHT ACTION */}
      <View className="absolute right-3 top-3">
        {isLoading ? (
          <ActivityIndicator size="small" color="#999" />
        ) : (
          !disabled && <Ionicons name="sync-outline" size={20} className="text-text-2" />
        )}
      </View>

      <View className="flex-1 px-4 pb-4 pt-2">
        {/* VALUE */}
        {isLoading ? (
          <Skeleton width={50} height={42} className="mb-6" />
        ) : (
          <Text
            style={{ lineHeight: 10, fontSize: 40, paddingTop: 46 }}
            className="pr-2 font-saira-semibold text-text-1">
            {displayValue}
          </Text>
        )}

        {/* LABEL ROW */}
        <View className="flex-row items-center gap-3">
          {/* ICON OR SPINNER PLACEHOLDER (KEEPS ALIGNMENT CONSISTENT) */}
          {icon && (
            <View className={`${iconBgColor} rounded-lg p-1`}>
              <Ionicons name={icon} size={24} color="#fff" />
            </View>
          )}

          {isLoading ? (
            <Skeleton width={110} height={18} />
          ) : (
            <Text
              className="font-saira-medium text-xl text-text-2"
              numberOfLines={1}
              adjustsFontSizeToFit>
              {title}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  if (disabled || !onPress) return Content;

  return (
    <Pressable className="flex-1" onPress={onPress}>
      {Content}
    </Pressable>
  );
};

export default StatCard;
