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
import { supabase } from '@/lib/supabase';
import { useRouter, Link } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import SafeViewWrapper from '@components/SafeViewWrapper';

const SignUpPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const slideAnim = useRef(new Animated.Value(1000)).current; // Start 300px left offscreen
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

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (data.user) {
      router.replace({
        pathname: '/(main)/onboarding/(profile-onboarding)/name',
        params: { user: data.user },
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Use proxy for dev (Expo Go), scheme for production
      const redirectTo = makeRedirectUri({
        scheme: 'breakroom',
        path: 'auth',
        useProxy: true, // true in Expo Go
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) throw error;

      // Open the system browser
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        console.log('OAuth result', result);
      }
    } catch (err) {
      console.error('Google login error', err);
      Alert.alert('Login Error', err.message || 'Something went wrong');
    }
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [{ translateX: slideAnim }],
        opacity: fadeAnim,
      }}>
      <SafeViewWrapper bottomColor="bg-bg-grouped-1">
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
          <View className="bg-bg-grouped-1" style={styles.container}>
            <View className="flex-1 justify-center gap-5">
              <View className="">
                <Text className="text-3xl font-bold text-text-1">Get Started!</Text>
                <Text className="text-lg text-text-2">Enter your details to create an account</Text>
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
              <View className="gap-2">
                <TextInput
                  className="h-16 rounded-xl border border-border-color bg-input-background px-4 pb-1 text-xl text-text-1 placeholder:text-text-3"
                  placeholder="Confirm Password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <Pressable
                className="h-16 items-center justify-center rounded-xl bg-brand"
                onPress={handleSignUp}
                disabled={loading}>
                <Text className="text-center text-xl font-semibold text-white">
                  {loading ? 'Signing Up...' : 'Sign Up'}
                </Text>
              </Pressable>
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
              onPress={() => signInWithGoogle()}>
              <Image
                source={require('@assets/google-logo.png')}
                className="absolute left-3 h-11 w-11"
              />
              <Text className="text-center text-lg text-text-1">Continue with Google</Text>
            </Pressable>

            <Text className="mt-4 text-center text-lg text-text-2">
              Already have an account?{' '}
              <Link className="text-theme-blue underline" href="/login">
                Login
              </Link>
            </Text>
          </View>
        </View>
      </SafeViewWrapper>
    </Animated.View>
  );
};

export default SignUpPage;

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
