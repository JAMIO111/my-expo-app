import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import PoolRack from '../components/PoolRack';
import { useColorScheme } from 'nativewind';

export default function Index() {
  const { colorScheme } = useColorScheme();
  return (
    <View className={`${colorScheme} w-full flex-1 items-center justify-between`}>
      <PoolRack />
    </View>
  );
}
