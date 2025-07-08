import { Pressable, Text, View } from 'react-native';
import React from 'react';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import colors from '@lib/colors';

const SettingsItem = ({ title, value, setValue, internalValue, lastItem = false }) => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
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
              pressed ? 'bg-background-dark' : 'bg-background-light'
            }`}>
            <Text className="text-text-1 flex-1 pl-3 text-lg font-medium">{title}</Text>

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
              className="h-[1px] w-full bg-background-dark"
              style={!pressed ? { marginLeft: 22 } : null} // ml-16 = 64px
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

export default SettingsItem;
