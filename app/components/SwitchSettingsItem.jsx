import { Pressable, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';
import { useEffect, useState } from 'react';
import { Switch } from 'react-native-gesture-handler';
import { iconMap } from './SettingsItem';

const SwitchSettingsItem = ({
  title,
  icon,
  iconBGColor = '#00000000',
  iconColor = '#000',
  setValue,
  defaultValue,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const [enabled, setEnabled] = useState(defaultValue);
  const [saving, setSaving] = useState(false);

  // Keep in sync if the underlying value changes from outside this
  // component (e.g. a cache patch after a successful write elsewhere).
  useEffect(() => {
    if (!saving) {
      setEnabled(defaultValue);
    }
  }, [defaultValue]);

  const handlePress = () => {
    if (saving || disabled) return;
    handleToggle(!enabled);
  };

  const handleToggle = async (newValue) => {
    setSaving(true);

    try {
      if (setValue) {
        await setValue(newValue);
      }
      setEnabled(newValue);
    } catch (error) {
      // Revert: the write failed, so don't show the toggle as changed.
      setEnabled(enabled);
    } finally {
      setSaving(false);
    }
  };

  const Icon = icon ? iconMap[icon] : null;

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
                {Icon && <Icon size={22} color={iconColor} />}
              </View>
            )}
            <Text className="flex-1 text-lg font-medium text-text-1">{title}</Text>

            <View className="justify-center">
              <Switch
                disabled={saving || disabled}
                value={enabled}
                onValueChange={handleToggle}
                thumbColor="white"
                trackColor={{
                  false: 'gray',
                  true: '#4CAF50',
                }}
              />
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default SwitchSettingsItem;
