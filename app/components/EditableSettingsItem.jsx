import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import { iconMap } from './SettingsItem';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import colors from '@lib/colors';
import { useRef } from 'react';

const EditableSettingsItem = ({
  title,
  icon,
  value,
  onChangeText,
  placeholder = '',
  iconColor = '#333',
  routerPath,
  lastItem = false,
  editable = true,
  keyboardType = 'default',
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const hasNavigated = useRef(false);

  const handlePress = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    setTimeout(() => {
      hasNavigated.current = false;
    }, 750);
    if (routerPath) router.push(routerPath);
  };

  const Icon = icon ? iconMap[icon] : null;

  return (
    <Pressable onPress={handlePress} disabled={!routerPath} className="w-full">
      {({ pressed }) => (
        <View className="w-full">
          <View
            className={`flex-row items-center gap-3 px-4 py-3 ${
              pressed ? 'bg-theme-gray-5' : 'bg-bg-grouped-2'
            }`}>
            {icon && Icon && <Icon size={24} color={iconColor} />}

            <Text
              numberOfLines={1}
              style={{ flexShrink: 0 }}
              className="w-32 pl-2 text-lg font-medium text-text-1">
              {title}
            </Text>

            <TextInput
              className="flex-1 py-1 pr-5 text-right text-xl text-text-2"
              style={{ lineHeight: 22, padding: 0 }}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              editable={editable && !routerPath}
              keyboardType={keyboardType}
              numberOfLines={1}
              ellipsizeMode="tail"
            />

            {routerPath && <IonIcons name="chevron-forward" size={18} color={themeColors.icon} />}
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default EditableSettingsItem;
