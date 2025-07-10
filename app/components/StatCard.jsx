import { StyleSheet, Text, View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import Ionicons from 'react-native-vector-icons/Ionicons';

const StatCard = ({ title, value, icon, color = 'bg-gray-500' }) => {
  return (
    <View className="bg-bg-grouped-2 shadow-[0_2px_4px_rgba(0,0,0,0.1)]" style={styles.card}>
      <View className="flex-row items-center justify-start gap-3">
        {icon && (
          <View className={`${color} rounded-lg p-1 `}>
            <Ionicons name={icon} size={24} color="#fff" />
          </View>
        )}
        <Text
          className="font-saira text-xl font-medium text-text-2"
          numberOfLines={1}
          ellipsizeMode="tail">
          {title}
        </Text>
      </View>
      <Text className="flex-1 pt-5 font-saira text-7xl font-extrabold text-text-1">{value}</Text>
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
