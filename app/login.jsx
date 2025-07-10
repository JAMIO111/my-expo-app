import { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import SafeViewWrapper from '@components/SafeViewWrapper';
import supabase from '@lib/supabaseClient';
import { useRouter, Link } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { useFonts } from 'expo-font';
import { Michroma_400Regular } from '@expo-google-fonts/michroma';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fontsLoaded] = useFonts({
    Michroma: Michroma_400Regular,
  });
  const slideAnim = useRef(new Animated.Value(-1000)).current; // Start 300px left offscreen
  const fadeAnim = useRef(new Animated.Value(0)).current; // start fully transparent

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay: 150,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('Players') // replace with your actual table name
      .select('onboarding')
      .eq('auth_id', userId)
      .single();

    setLoading(false);

    if (profileError) {
      setError('Failed to load profile');
      return;
    }

    if (profile.onboarding === 0) {
      router.replace('/(main)/onboarding/profile-creation');
    } else if (profile.onboarding === 1) {
      router.replace('/(main)/onboarding/profile-creation5');
    } else {
      router.replace('/(main)/home');
    }
  };

  const signInWithProvider = async (provider) => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUri },
      });

      if (error) throw error;

      const result = await AuthSession.startAsync({ authUrl: data.url });

      if (result.type !== 'success') {
        Alert.alert('Login cancelled');
      }
    } catch (err) {
      console.error('OAuth error:', err);
      Alert.alert('Login Error', err.message || 'Something went wrong.');
    }
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [{ translateX: slideAnim }],
        opacity: fadeAnim,
      }}>
      <SafeViewWrapper bottomColor="bg-background-dark" topColor="bg-brand">
        <View className="flex-1">
          <View className="w-full justify-center bg-brand">
            <View className="flex-row items-center justify-center gap-2">
              <Text style={styles.title}>Break</Text>
              <Image
                source={require('@assets/Break-Room-Logo-1024-Background.png')}
                className="mt-2 h-14 w-14"
                resizeMode="contain"
              />
              <Text style={styles.title}>Room</Text>
            </View>
            <View>
              <View className="h-5 w-full flex-row gap-12">
                <View className="flex-1 rounded-tr-xl bg-brand-light shadow"></View>
                <View className="flex-1 rounded-tl-xl bg-brand-light shadow"></View>
              </View>
              <View className="relative h-10 w-full flex-row items-center justify-around bg-orange-950">
                <View className="h-3 w-3 rounded-full bg-slate-400"></View>
                <View className="h-3 w-3 rounded-full bg-slate-400"></View>
                <View className="absolute bottom-4 h-12 w-12 rounded-full bg-black"></View>
                <View className="h-3 w-3 rounded-full bg-slate-400"></View>
                <View className="h-3 w-3 rounded-full bg-slate-400"></View>
              </View>
            </View>
          </View>
          <View className="bg-background-dark" style={styles.container}>
            <View className="flex-1 justify-center gap-5">
              <View class>
                <Text className="text-3xl font-bold text-text-1">Welcome back!</Text>
                <Text className="text-lg text-text-2">Enter your details to sign in.</Text>
              </View>
              <TextInput
                className="h-16 rounded-xl border border-border-color bg-input-background px-4 pb-1 text-xl text-text-1 placeholder:text-text-3"
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <View className="gap-2">
                <TextInput
                  className="h-16 rounded-xl border border-border-color bg-input-background px-4 pb-1 text-xl text-text-1 placeholder:text-text-3"
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <Pressable
                className="h-16 items-center justify-center rounded-xl bg-brand"
                onPress={handleLogin}
                disabled={loading}>
                <Text className="text-center text-xl font-semibold text-white">
                  {loading ? 'Logging in...' : 'Log In'}
                </Text>
              </Pressable>
              <Text className="text-center text-lg text-text-2">
                Forgotten Password?{' '}
                <Link className="text-theme-blue underline" href="/signup">
                  Reset
                </Link>
              </Text>
            </View>

            <View className="h-16 flex-row items-center gap-5">
              <View className="h-0.5 flex-1 bg-border-color" />
              <Text className="text-text-2">Or</Text>
              <View className="h-0.5 flex-1 bg-border-color" />
            </View>

            <Pressable
              className="mt-4 h-16 flex-row items-center justify-center gap-5 rounded-xl border border-border-color bg-input-background"
              onPress={() => signInWithProvider('facebook')}>
              <Image
                source={require('@assets/Facebook-logo.png')}
                className="absolute left-3 h-12 w-12"
              />
              <Text className="text-center text-lg text-text-1">Continue with Facebook</Text>
            </Pressable>

            <Pressable
              className="mt-4 h-16 flex-row items-center justify-center gap-5 rounded-xl border border-border-color bg-input-background"
              onPress={() => signInWithProvider('google')}>
              <Image
                source={require('@assets/google-logo.png')}
                className="absolute left-3 h-11 w-11"
              />
              <Text className="text-center text-lg text-text-1">Continue with Google</Text>
            </Pressable>

            <Text className="mt-4 text-center text-lg text-text-2">
              Don't have an account?{' '}
              <Link className="text-theme-blue underline" href="/signup">
                Sign Up
              </Link>
            </Text>
          </View>
        </View>
      </SafeViewWrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: {
    color: 'white',
    fontFamily: 'Michroma',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },

  errorText: { color: 'red', marginBottom: 10, paddingLeft: 10, textAlign: 'left' },
});
