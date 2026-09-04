import { Text } from 'react-native';
import { View } from 'react-native';
const Heading = ({ text, className, notificationCount = 0 }) => {
  return (
    <View className={`mb-1 flex-row items-center gap-3 ${className}`}>
      <Text className="pl-1 text-left font-tektur-semibold text-2xl text-text-1">{text}</Text>
      {notificationCount > 0 && (
        <View
          style={{ height: 22, width: 22 }}
          className="items-center justify-center rounded-full bg-theme-red/75 shadow-sm">
          <Text style={{ fontSize: 12 }} className="font-tektur-medium text-white">
            {notificationCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export default Heading;
