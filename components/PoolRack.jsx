import { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Michroma_400Regular } from '@expo-google-fonts/michroma';
import { supabase } from 'lib/supabaseClient';

const PoolRack = () => {
  const [fontsLoaded] = useFonts({
    Michroma: Michroma_400Regular,
  });
  const router = useRouter();
  const [moved, setMoved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Shared animation values
  const cueY = useSharedValue(0);
  const logoOpacity = useSharedValue(1);

  // Cue ball animation
  const cueBallStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cueY.value }],
  }));

  // Logo fade animation
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const onAnimationEnd = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      router.replace('/login');
    } else {
      router.replace('/(main)/home'); // or your main layout route
    }
  };

  const handleNavigation = () => {
    setLoading(true);

    // Fade out logo
    logoOpacity.value = withTiming(0, { duration: 500 });

    // Move cue ball and then run navigation
    cueY.value = withTiming(500, { duration: 1500, easing: Easing.out(Easing.exp) }, () => {
      runOnJS(onAnimationEnd)();
    });
  };

  if (!fontsLoaded) return null;

  return (
    <Pressable
      onPress={handleNavigation}
      className="bg-brand relative w-full flex-1"
      style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
      }}>
      {/* Top Section */}
      <View className=" w-full items-center justify-between"></View>
      <View className="absolute top-[20%] h-0.5 w-full items-center justify-between bg-black"></View>

      {/* Cue Ball + Prompt */}
      <View className="absolute top-[15%] mb-10 items-center justify-center">
        <Animated.View
          className="h-8 w-8 rounded-full border border-white bg-white"
          style={cueBallStyle}
        />
      </View>
      {/* Logo (fades out on tap) */}
      <Text className="font-michroma absolute top-[50%] mb-8 text-5xl font-bold text-white">
        Break Room
      </Text>
      <Animated.View style={[{ alignItems: 'center', marginBottom: 20 }, logoStyle]}>
        <Image
          source={require('../assets/Break-Room-Logo-1024-Background.png')}
          style={[
            {
              width: 180,
              height: 180,
              borderRadius: 10,
              absolute: true,
              top: -30,
            },
          ]}
          resizeMode="cover"
        />
        <Text className="pb-10 text-lg text-white">Tap to continue!</Text>
      </Animated.View>
      <View className="absolute -left-4 -top-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -left-7 top-[50%] h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -right-7 top-[50%] h-12 w-12 rounded-full bg-black"></View>
    </Pressable>
  );
};

export default PoolRack;
