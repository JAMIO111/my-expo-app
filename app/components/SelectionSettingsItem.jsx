import { Pressable, Text, View } from 'react-native';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';

const SelectionSettingsItem = ({ title, value, setValue, internalValue, lastItem = false }) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];

  const handlePress = () => {
    setValue?.(internalValue);
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

            {(internalValue === value || (value?.includes && value.includes(internalValue))) && (
              <IonIcons
                name="checkmark"
                size={24}
                color={colorScheme === 'dark' ? 'white' : themeColors.info.primary}
              />
            )}
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

export default SelectionSettingsItem;
