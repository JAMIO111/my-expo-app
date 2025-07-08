import { Pressable, Text, View } from 'react-native';
import React from 'react';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import colors from '@lib/colors';

const SettingsItem = ({
  title,
  icon,
  routerPath,
  iconBGColor = 'gray',
  iconColor = '#fff',
  lastItem = false,
}) => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme];

  const handlePress = () => {
    if (routerPath) {
      router.push(routerPath);
    }
  };

  return (
    <Pressable onPress={handlePress} className="w-full">
      {({ pressed }) => (
        <View className="w-full">
          <View
            className={`flex-row items-center gap-5 px-4 py-3 ${
              pressed ? 'bg-theme-gray-5' : 'bg-bg-grouped-2'
            }`}>
            {icon && (
              <View
                className="h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: iconBGColor }}>
                <IonIcons name={icon} size={22} color={iconColor} />
              </View>
            )}

            <Text className="flex-1 text-lg font-medium text-text-1">{title}</Text>

            {routerPath && <IonIcons name="chevron-forward" size={18} color={themeColors.icon} />}
          </View>

          {!lastItem && (
            <View
              className="h-[0.5px] w-full bg-separator"
              style={!pressed ? { marginLeft: 64 } : null} // ml-16 = 64px
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

export default SettingsItem;
