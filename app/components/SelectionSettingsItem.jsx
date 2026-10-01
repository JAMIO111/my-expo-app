import { Pressable, Text, View } from 'react-native';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@contexts/ThemeProvider';

const SelectionSettingsItem = ({
  title,
  value,
  setValue,
  internalValue,
  lastItem = false,
  swatchColor,
}) => {
  const { colors: themeColors, isDark } = useTheme();

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
            {swatchColor && (
              <View
                className="ml-3 h-7 w-7 rounded-full border border-separator"
                style={{ backgroundColor: swatchColor }}
              />
            )}
            <Text className="flex-1 pl-3 text-lg font-medium text-text-1">{title}</Text>

            {(internalValue === value || (value?.includes && value.includes(internalValue))) && (
              <IonIcons
                name="checkmark"
                size={24}
                color={isDark ? 'white' : themeColors.brand.primary}
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
