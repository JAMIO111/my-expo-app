import { Text, View, Image, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BellDot } from 'lucide-react-native';
import { useNotificationsPanel } from '@contexts/NotificationsPanelProvider';

const BrandHeader = ({
  text1 = 'Break',
  text2 = 'Room',
  backgroundColor = 'bg-brand',
  showNotification = false,
}) => {
  const colorScheme = useColorScheme();
  const { open } = useNotificationsPanel();
  return (
    <View className={`h-16 flex-row items-center justify-center ${backgroundColor}`}>
      {showNotification && <View className="w-12" />}
      <Text className="flex-1 pb-2 text-right font-michroma text-2xl font-bold text-white">
        {text1}
      </Text>
      <Image
        source={
          colorScheme === 'dark'
            ? require('@assets/Break-Room-Logo-2-1024-Background-Dark.png')
            : require('@assets/Break-Room-Logo-2-1024-Background.png')
        }
        className="mx-1 h-14 w-14"
        resizeMode="contain"
      />
      <Text className="flex-1 pb-2 text-left font-michroma text-2xl font-bold text-white">
        {text2}
      </Text>
      {showNotification && (
        <Pressable className="w-12 items-start justify-center" onPress={open}>
          <BellDot size={24} color="white" strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
};

export default BrandHeader;
