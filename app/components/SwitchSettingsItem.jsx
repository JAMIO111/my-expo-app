import { Pressable, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';
import { useState } from 'react';
import { Switch } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';

const SwitchSettingsItem = ({
  title,
  icon,
  iconBGColor = 'gray',
  iconColor = '#fff',
  value,
  setValue,
  defaultValue,
  lastItem = false,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const [enabled, setEnabled] = useState(defaultValue);
  const [saving, setSaving] = useState(false);

  const handlePress = () => {
    handleToggle(!enabled);
  };

  const handleToggle = async (newValue) => {
    setEnabled(newValue);
    setSaving(true);

    if (setValue) {
      await setValue(newValue);
    }

    setSaving(false);
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
                <Ionicons name={icon} size={22} color={iconColor} />
              </View>
            )}
            <Text className="flex-1 text-lg font-medium text-text-1">{title}</Text>

            <View className="justify-center">
              <Switch
                disabled={saving}
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

          {!lastItem && (
            <View
              className="h-[0.5px] w-full bg-separator"
              style={!pressed ? { marginLeft: 22 } : null} // ml-16 = 64px
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

export default SwitchSettingsItem;
