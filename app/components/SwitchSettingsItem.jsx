import { Pressable, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';
import { useState } from 'react';
import { Switch } from 'react-native-gesture-handler';

const SwitchSettingsItem = ({ title, value, setValue, defaultValue, lastItem = false }) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const [enabled, setEnabled] = useState(defaultValue);

  const handlePress = () => {
    setEnabled((prev) => !prev);
  };

  return (
    <Pressable onPress={handlePress} className="w-full">
      {({ pressed }) => (
        <View className="w-full">
          <View
            className={`flex-row items-center gap-5 px-4 py-3 ${
              pressed ? 'bg-theme-gray-5' : 'bg-bg-grouped-2'
            }`}>
            <Text className="flex-1 pl-3 text-lg font-medium text-text-1">{title}</Text>

            <Switch
              value={enabled}
              onValueChange={setEnabled}
              thumbColor={enabled ? 'white' : 'white'}
              trackColor={{
                false: 'gray',
                true: '#4CAF50',
              }}
            />
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
