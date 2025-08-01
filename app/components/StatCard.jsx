import { StyleSheet, Text, View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import Ionicons from 'react-native-vector-icons/Ionicons';

const StatCard = ({ title, value, icon, color = 'bg-gray-500' }) => {
  return (
    <View className="flex-1 flex-row items-center overflow-hidden rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      {/* Red side bar */}
      <View className="h-full w-3 bg-brand-light" />

      {/* Main content */}
      <View className="flex-1 gap-2 p-0 px-4 pt-3">
        {/* Top row with icon and title */}
        <View className="flex-row items-center gap-3">
          {icon && (
            <View className={`${color} rounded-lg p-1`}>
              <Ionicons name={icon} size={24} color="#fff" />
            </View>
          )}
          <Text
            className="font-saira-medium text-2xl font-medium text-text-2"
            numberOfLines={1}
            ellipsizeMode="tail">
            {title}
          </Text>
        </View>

        {/* Large value text */}
        <Text className="pt-4 font-saira text-6xl font-extrabold text-text-1">{value}</Text>
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
