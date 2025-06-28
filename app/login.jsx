import React, { useState, useEffect, useRef } from 'react';
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
import { supabase } from '../lib/supabaseClient';
import { useRouter, Link } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { useFonts } from 'expo-font';
import { Michroma_400Regular } from '@expo-google-fonts/michroma';
import { useColorScheme } from 'nativewind';

export default function LoginPage() {
  const { colorScheme } = useColorScheme();
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (data.user) {
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
      <View className={`${colorScheme} flex-1`}>
        <View className="bg-brand w-full justify-center">
          <Text style={styles.title}>Break Room</Text>
          <View>
            <View className="h-5 w-full flex-row gap-12">
              <View className="bg-brand-light flex-1 rounded-tr-xl shadow"></View>
              <View className="bg-brand-light flex-1 rounded-tl-xl shadow"></View>
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
              <Text className="text-text-primary text-3xl font-bold">Welcome back!</Text>
              <Text className="text-text-secondary text-lg">Enter your details to sign in.</Text>
            </View>
            <TextInput
              className="border-border-color placeholder:text-text-muted text-text-primary bg-input-background h-16 rounded-xl border px-4 pb-1 text-xl"
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <View className="gap-2">
              <TextInput
                className="border-border-color placeholder:text-text-muted text-text-primary bg-input-background h-16 rounded-xl border px-4 pb-1 text-xl"
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <Pressable
              className="bg-brand h-16 items-center justify-center rounded-xl"
              onPress={handleLogin}
              disabled={loading}>
              <Text className="text-center text-xl font-semibold text-white">
                {loading ? 'Logging in...' : 'Log In'}
              </Text>
            </Pressable>
            <Text className="text-text-secondary text-center text-lg">
              Forgotten Password?{' '}
              <Link className="text-blue-600 underline" href="/signup">
                Reset
              </Link>
            </Text>
          </View>

          <View className="h-16 flex-row items-center gap-5">
            <View className="bg-border-color h-0.5 flex-1" />
            <Text className="text-text-secondary">Or</Text>
            <View className="bg-border-color h-0.5 flex-1" />
          </View>

          <Pressable
            className="border-border-color bg-input-background mt-4 h-16 flex-row items-center justify-center gap-5 rounded-xl border"
            onPress={() => signInWithProvider('facebook')}>
            <Image
              source={require('../assets/Facebook-logo.png')}
              className="absolute left-3 h-12 w-12"
            />
            <Text className="text-text-primary text-center text-lg">Continue with Facebook</Text>
          </Pressable>

          <Pressable
            className="border-border-color bg-input-background mt-4 h-16 flex-row items-center justify-center gap-5 rounded-xl border"
            onPress={() => signInWithProvider('google')}>
            <Image
              source={require('../assets/google-logo.png')}
              className="absolute left-3 h-11 w-11"
            />
            <Text className="text-text-primary text-center text-lg">Continue with Google</Text>
          </Pressable>

          <Text className="text-text-secondary mt-4 text-center text-lg">
            Don't have an account?{' '}
            <Link className="text-blue-600 underline" href="/signup">
              Sign Up
            </Link>
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: {
    color: 'white',
    fontFamily: 'Michroma',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 30,
  },

  errorText: { color: 'red', marginBottom: 10, paddingLeft: 10, textAlign: 'left' },
});
