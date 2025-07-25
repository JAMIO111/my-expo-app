import { View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import { Slot } from 'expo-router';
import { useColorScheme } from 'nativewind';

const _layout = () => {
  const { colorScheme } = useColorScheme();
  console.log('Current Color Scheme:', colorScheme);
  return (
    <View className={`${colorScheme} flex-1`}>
      <Slot />
    </View>
  );
};

export default _layout;
