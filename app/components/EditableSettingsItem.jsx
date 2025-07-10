import { Pressable, Text, TextInput, View } from 'react-native';
import React, { useState } from 'react';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import colors from '@lib/colors';

const EditableSettingsItem = ({
  title,
  icon,
  value,
  onChangeText,
  placeholder = '',
  iconBGColor = 'gray',
  iconColor = '#fff',
  routerPath,
  lastItem = false,
  editable = true,
  keyboardType = 'default',
}) => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const themeColors = colors[colorScheme];

  const handlePress = () => {
    if (routerPath) router.push(routerPath);
  };

  return (
    <Pressable onPress={handlePress} disabled={!routerPath} className="w-full">
      {({ pressed }) => (
        <View className="w-full">
          <View
            className={`flex-row items-center gap-3 px-4 py-3 ${
              pressed ? 'bg-theme-gray-5' : 'bg-bg-grouped-2'
            }`}>
            {icon && (
              <View
                className="h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: iconBGColor }}>
                <IonIcons name={icon} size={22} color={iconColor} />
              </View>
            )}

            <Text
              numberOfLines={1}
              style={{ flexShrink: 0 }}
              className="w-32 pl-2 text-lg font-medium text-text-1">
              {title}
            </Text>

            <TextInput
              className="flex-1 py-1 text-left text-xl text-text-2"
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

          {!lastItem && (
            <View
              className={`${icon ? 'ml-16' : 'ml-5'} h-[0.5px] w-full ${
                !pressed ? 'bg-separator' : 'bg-transparent'
              }`}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

export default EditableSettingsItem;
