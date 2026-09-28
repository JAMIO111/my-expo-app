import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@contexts/ThemeProvider';
import { useEffect, useState } from 'react';
import { Switch } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { iconMap } from './SettingsItem';

const SwitchSettingsItem = ({
  title,
  icon,
  iconColor,
  setValue,
  defaultValue,
  disabled = false,
}) => {
  const { colors: themeColors } = useTheme();
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
      console.error(`[SwitchSettingsItem] Failed to save "${title}":`, error);
      setEnabled(enabled);
      Toast.show({
        type: 'error',
        text1: 'Failed to save change',
        text2: error?.message,
      });
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
            {icon && Icon && <Icon size={24} color={iconColor ?? themeColors.icon} />}
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
