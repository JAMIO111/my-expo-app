import { StyleSheet, Text, View } from 'react-native';
import Podium3D from '@components/Podium';

const index = () => {
  return (
    <View className="flex-1 items-center justify-center bg-brand-dark p-5">
      <Podium3D />
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  trapazoid1: {
    width: 80,
    height: 50,
    backgroundColor: 'blue',
    transform: [{ skewY: '20deg' }],
  },
});
