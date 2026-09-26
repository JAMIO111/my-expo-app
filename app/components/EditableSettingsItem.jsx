import { Pressable, Text, TextInput, View } from 'react-native';
import { iconMap } from './SettingsItem';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { useTheme } from '@contexts/ThemeProvider';

const EditableSettingsItem = ({
  title,
  icon,
  value,
  onChangeText,
  placeholder = '',
  iconColor = '#333',
  routerPath,
  editable = true,
  keyboardType = 'default',
  autoCapitalize = 'none',
}) => {
  const router = useRouter();
  const { colors: themeColors } = useTheme();
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
              className="w-32 flex-1 pl-2 text-lg font-medium text-text-1">
              {title}
            </Text>

            <TextInput
              className="flex-1 py-1 pr-5 text-left text-xl text-text-2"
              style={{ lineHeight: 22, padding: 0 }}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              editable={editable && !routerPath}
              keyboardType={keyboardType}
              numberOfLines={1}
              ellipsizeMode="tail"
              autoCapitalize={autoCapitalize}
              autoComplete="off"
              autoCorrect={false}
            />

            {routerPath && <IonIcons name="chevron-forward" size={18} color={themeColors.icon} />}
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default EditableSettingsItem;
