import { Text, View, Image, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import { BellDot, Bell } from 'lucide-react-native';
import { useNotificationsPanel } from '@contexts/NotificationsPanelProvider';

const BrandHeader = ({
  text1 = 'Break',
  text2 = 'Room',
  backgroundColor = 'bg-brand',
  showNotification = false,
}) => {
  const colorScheme = useColorScheme();
  const { open, unreadCount } = useNotificationsPanel();
  return (
    <View className={`h-16 flex-row items-center justify-center gap-2 ${backgroundColor}`}>
      {showNotification && <View className="w-12" />}
      <Text className="mt-2 flex-1 pb-2 text-right font-michroma text-3xl text-[#D9D9D9]">
        {text1}
      </Text>
      <Image
        source={
          colorScheme === 'dark'
            ? require('@assets/BR-Logo-1024-No-Background.png')
            : require('@assets/BR-Logo-1024-No-Background.png')
        }
        className="mx-1 h-12 w-12"
        resizeMode="contain"
      />
      <Text className="mt-2 flex-1 pb-2 text-left font-michroma text-3xl text-[#D9D9D9]">
        {text2}
      </Text>
      {showNotification && (
        <Pressable hitSlop={10} className="relative w-12 items-start justify-center" onPress={open}>
          <Bell size={28} color="white" strokeWidth={2} />

          {unreadCount > 0 && (
            <View
              style={{ top: -6, left: 13, width: 21, height: 21, borderWidth: 1.5 }}
              className="absolute items-center justify-center rounded-full border border-brand bg-red-500">
              <Text className="text-center font-tektur-medium text-xs text-white">
                {unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
};

export default BrandHeader;
