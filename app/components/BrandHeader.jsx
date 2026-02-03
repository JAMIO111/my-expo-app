import { Text, View, Image } from 'react-native';
import { useColorScheme } from 'react-native';

const BrandHeader = ({ text1 = 'Break', text2 = 'Room', backgroundColor = 'bg-brand' }) => {
  const colorScheme = useColorScheme();
  return (
    <View className={`h-16 flex-row items-center justify-center ${backgroundColor}`}>
      <Text className="flex-1 pb-2 text-right font-michroma text-2xl font-bold text-white">
        {text1}
      </Text>
      <Image
        source={
          colorScheme === 'dark'
            ? require('@assets/Break-Room-Logo-1024-Background-Dark.png')
            : require('@assets/Break-Room-Logo-1024-Background.png')
        }
        className="mx-1 h-14 w-14"
        resizeMode="contain"
      />
      <Text className="flex-1 pb-2 text-left font-michroma text-2xl font-bold text-white">
        {text2}
      </Text>
    </View>
  );
};

export default BrandHeader;
