import { Pressable, Text, View } from 'react-native';
import { useRef } from 'react';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';
import Avatar from './Avatar';

const SettingsItem = ({
  title,
  icon,
  text,
  routerPath,
  iconBGColor = 'gray',
  iconColor = '#fff',
  lastItem = false,
  disabled = false,
  callbackFn,
  player,
  value,
  setValue,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const router = useRouter();
  const hasNavigated = useRef(false);

  const handlePress = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    setTimeout(() => {
      hasNavigated.current = false;
    }, 750); // Reset navigation state after 750ms
    if (routerPath) {
      router.push(routerPath);
    }
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={routerPath ? handlePress : callbackFn}
      className="w-full">
      {({ pressed }) => (
        <View className="w-full">
          <View
            className={`flex-row items-center gap-3 px-4 py-3 ${
              pressed ? 'bg-theme-gray-5' : 'bg-bg-grouped-2'
            }`}>
            {icon ? (
              <View
                className="h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: iconBGColor }}>
                <IonIcons name={icon} size={22} color={iconColor} />
              </View>
            ) : player ? (
              <Avatar size={40} player={player} />
            ) : null}

            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ flexShrink: 0 }}
              className={`${text ? '' : 'flex-1'} pl-2 text-lg font-medium text-text-1`}>
              {title}
            </Text>

            {text && (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="ml-2 flex-1 text-right text-lg text-text-2">
                {text}
              </Text>
            )}

            {routerPath && <IonIcons name="chevron-forward" size={18} color={themeColors?.icon} />}
          </View>

          {!lastItem && (
            <View
              className={`${icon ? 'ml-16' : 'ml-5'} h-[0.5px] w-full ${!pressed ? 'bg-separator' : 'bg-transparent'}`}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

export default SettingsItem;
