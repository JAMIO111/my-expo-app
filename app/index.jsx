import { View, Text } from 'react-native';
import PoolRack from '@components/PoolRack';

export default function Index() {
  return (
    <View className={`w-full flex-1 items-center justify-between`}>
      <PoolRack />
    </View>
  );
}
