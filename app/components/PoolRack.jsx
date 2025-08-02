import { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Michroma_400Regular } from '@expo-google-fonts/michroma';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import { useUser } from '@contexts/UserProvider';
import { fetchAuthUserProfile } from '@hooks/useAuthUserProfile2';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const PoolRack = () => {
  const { client: supabase } = useSupabaseClient();
  console.log(supabase, 'Supabase Client in PoolRack');
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Michroma: Michroma_400Regular,
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { roles, currentRole, setCurrentRole } = useUser();

  // Shared animation values
  const cueY = useSharedValue(0);
  const logoOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(1);

  // Cue ball animation
  const cueBallStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -cueY.value }],
  }));

  // Logo fade animation
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const flashingTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  useEffect(() => {
    if (fontsLoaded && !loading) {
      textOpacity.value = withRepeat(
        withTiming(0.1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [fontsLoaded, loading]);

  const onAnimationEnd = async () => {
    console.log('🔵 onAnimationEnd starting...');

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log('👤 User result:', user);
    console.log('⚠️ Error result:', error);

    if (error || !user) {
      console.warn('🔴 No user or error getting user:', error);
      router.replace('/login');
      return;
    }

    console.log('🟢 Authenticated user:', user);

    let profile;
    try {
      profile = await fetchAuthUserProfile(supabase);
      console.log('🟣 Profile fetched:', profile);
    } catch (e) {
      console.error('🔴 Failed to fetch profile:', e);
      router.replace('/login');
      return;
    }

    const roles = profile.roles || [];

    if (roles.length === 1) {
      console.log('Auto-selecting role:', roles[0]);
      setCurrentRole(roles[0]);
      router.replace('/(main)/home');
    } else if (roles.length > 1) {
      console.log('Multiple roles found:', roles);
      router.replace('/role-select');
    } else {
      console.warn('User has no assigned roles');
      router.replace('/login');
    }
  };

  const handleNavigation = () => {
    console.log('🟢 handleNavigation triggered');
    setLoading(true);
    logoOpacity.value = withTiming(0, { duration: 500 });
    cueY.value = withTiming(500, { duration: 2500, easing: Easing.out(Easing.exp) }, () => {
      console.log('🟡 Animation completed, running onAnimationEnd');
      runOnJS(onAnimationEnd)();
    });
  };

  if (!fontsLoaded) return null;

  return (
    <View className="w-full flex-1">
      <StatusBar style="light" />
      <Pressable
        onPress={handleNavigation}
        className={`${colorScheme} relative w-full flex-1 bg-brand`}
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 10,
        }}>
        {/* Top Section */}
        <View className=" w-full items-center justify-between"></View>
        <View className="absolute top-[75%] -z-10 h-0.5 w-full items-center justify-between bg-theme-gray-1"></View>

        {/* Cue Ball + Prompt */}
        <View className="absolute bottom-[15%] mb-10 items-center justify-center">
          <Animated.View
            className="h-8 w-8 rounded-full border border-white bg-white"
            style={cueBallStyle}
          />
        </View>
        {/* Logo (fades out on tap) */}

        <Animated.View
          className="absolute top-[10%] flex-1 items-center justify-center"
          style={[{ alignItems: 'center' }, logoStyle]}>
          <Image
            source={
              colorScheme === 'dark'
                ? require('@assets/Break-Room-Logo-1024-Background-Dark.png')
                : require('@assets/Break-Room-Logo-1024-Background.png')
            }
            style={[
              {
                width: 200,
                height: 200,
                borderRadius: 10,
              },
            ]}
            resizeMode="cover"
          />
          <View className="rounded-2xl border-2 border-brand-light bg-brand-dark px-6 pb-2 pt-6 shadow-xl shadow-brand-light">
            <Text className="mb-2 font-michroma text-6xl text-white">Break</Text>
            <Text className="font-michroma text-6xl text-white">Room</Text>
          </View>
        </Animated.View>
        <Animated.Text style={flashingTextStyle} className="pb-20 text-xl text-white">
          {loading ? 'Loading content...' : 'Tap to continue!'}
        </Animated.Text>
        <View className="absolute inset-x-0 items-center justify-center">
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
      </Pressable>
    </View>
  );
};

export default PoolRack;
