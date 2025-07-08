import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import CTAButton from './components/CTAButton';

const rows = [
  ['yellow', 'red', 'yellow', 'yellow', 'red'],
  ['red', 'yellow', 'red', 'yellow'],
  ['yellow', 'black', 'red'],
  ['red', 'yellow'],
  ['yellow'],
];

const getBallColor = (color) => {
  switch (color) {
    case 'red':
      return 'bg-red-600';
    case 'yellow':
      return 'bg-yellow-400';
    case 'black':
      return 'bg-black';
    default:
      return 'bg-white';
  }
};

const notFound = () => {
  const router = useRouter();
  return (
    <View className="relative flex-1 items-center justify-center gap-3 bg-brand">
      <Text className="py-6 font-delagothic text-8xl font-bold text-white">404</Text>
      <Text className="font-michroma text-2xl text-white">Oops! Page not found.</Text>
      <View className="mt-20 w-[70%] flex-row items-center">
        <View className="flex-1">
          <CTAButton text="Go Home" type="info" callbackFn={() => router.replace('/(main)/home')} />
        </View>
      </View>
      <View className="absolute -left-4 -top-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -left-7 top-[50%] h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -right-7 top-[50%] h-12 w-12 rounded-full bg-black"></View>
      {/* Rack */}

      <View className="absolute bottom-16 mb-10 items-center justify-center">
        <View className="h-8 w-8 rounded-full border border-white bg-white" />
      </View>
    </View>
  );
};

export default notFound;

const styles = StyleSheet.create({});
