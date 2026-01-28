import { StyleSheet, Text, View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import Ionicons from 'react-native-vector-icons/Ionicons';

const StatCard = ({
  title,
  value,
  icon,
  iconBgColor = 'bg-gray-500',
  backgroundColor = 'bg-bg-grouped-3',
}) => {
  return (
    <View
      className={`flex-1 flex-row items-center overflow-hidden rounded-2xl border-0 border-brand-light ${backgroundColor} shadow-[0_2px_4px_rgba(0,0,0,0.1)]`}>
      {/* Red side bar */}
      <View className="h-full w-0 bg-brand-light" />

      {/* Main content */}
      <View className="flex-1 gap-2 p-0 px-4 pt-3">
        {/* Top row with icon and title */}
        <View className="flex-row items-center gap-3">
          {icon && (
            <View className={`${iconBgColor} rounded-lg p-1`}>
              <Ionicons name={icon} size={24} color="#fff" />
            </View>
          )}
          <Text className="font-saira text-lg text-text-2" numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </View>

        {/* Large value text */}
        <Text className="pt-4 font-saira-semibold text-5xl text-text-1">{value}</Text>
      </View>
    </View>
  );
};

export default StatCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 128,
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
});
