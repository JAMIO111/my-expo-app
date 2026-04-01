import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import CTAButton from './components/CTAButton';
import Ionicons from '@expo/vector-icons/Ionicons';

const notFound = () => {
  const router = useRouter();
  return (
    <View className="relative flex-1 items-center justify-center gap-3 bg-brand">
      <Text className="py-6 font-delagothic text-8xl font-bold text-white">404</Text>
      <Text className="font-michroma text-2xl text-white">Oops! Page not found.</Text>
      <View className="mt-20 w-[70%] flex-row items-center">
        <View className="flex-1">
          <CTAButton text="Go Home" type="yellow" callbackFn={() => router.replace('/')} />
        </View>
      </View>
      <View className="absolute inset-x-0 top-0 items-center justify-center">
        <View className="h-8 w-full flex-row items-center justify-around bg-red-950 px-10">
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
        </View>
        <View className="h-5 w-full bg-brand-light"></View>
      </View>
      <View className="absolute bottom-0 w-full items-center justify-center">
        <View className="h-5 w-full bg-brand-light"></View>
        <View className="h-8 w-full flex-row items-center justify-around bg-red-950 px-10">
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
        </View>
      </View>
      <View className="absolute left-0 h-full flex-row">
        <View className="h-full w-6 items-center justify-around bg-red-950 py-20">
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-red-950"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
        </View>
        <View className="-z-10 h-full w-5 bg-brand-light"></View>
      </View>
      <View className="absolute right-0 h-full flex-row">
        <View className="-z-10 h-full w-5 bg-brand-light"></View>
        <View className="h-full w-6 items-center justify-around bg-red-950 py-20">
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-red-950"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
          <View className="h-2 w-2 rounded-full bg-gray-400"></View>
        </View>
      </View>
      <View className="absolute left-3 top-5 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute right-3 top-5 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute bottom-5 left-3 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute bottom-5 right-3 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute left-2 top-[50%] h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute right-2 top-[50%] h-12 w-12 rounded-full bg-black"></View>
      {/* Rack */}

      <View className="absolute bottom-16 mb-10 items-center justify-center">
        <View className="h-8 w-8 rounded-full border border-white bg-white" />
      </View>
    </View>
  );
};

export default notFound;

const styles = StyleSheet.create({});
