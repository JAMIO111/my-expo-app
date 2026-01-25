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
import { useRouter, Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useFonts } from 'expo-font';
import { Michroma_400Regular } from '@expo-google-fonts/michroma';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const LoginPage = () => {
  const { client: supabase } = useSupabaseClient();
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

  useEffect(() => {
    const handleUrl = async (event) => {
      try {
        const { url } = event;

        // Get session from the redirect URL
        const { data, error } = await supabase.auth.getSessionFromUrl({ url });
        if (error) throw error;

        const session = data.session;
        console.log('OAuth session:', session); // <-- log session

        if (!session) return;

        const userId = session.user.id;

        // fetch onboarding info for first-time users
        const { data: profile, error: profileError } = await supabase
          .from('Players')
          .select('onboarding')
          .eq('auth_id', userId)
          .single();

        if (profileError) throw profileError;
      } catch (err) {
        console.error('OAuth redirect error:', err);
      }
    };

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', handleUrl);

    // Handle cold start (when the app opens from an OAuth link)
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) handleUrl({ url: initialUrl });
    })();

    return () => subscription.remove();
  }, []);

  // ---------------------
  // Email/password login
  // ---------------------
  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('Players')
      .select('onboarding')
      .eq('auth_id', userId)
      .single();

    if (profileError) {
      setError('Failed to load profile');
      return;
    }
  };

  // ---------------------
  // OAuth login
  // ---------------------
  const signInWithProvider = async (provider) => {
    try {
      const redirectUri = makeRedirectUri({
        scheme: 'breakroom',
        useProxy: false, // dev/standalone
      });

      // start OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUri },
      });
      if (error) throw error;

      // Open system browser for login
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        // Parse the URL fragment into a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSessionFromUrl({
          url: result.url,
        });

        if (sessionError) throw sessionError;

        console.log('Logged in session:', sessionData.session);

        // Now navigate based on onboarding
        const userId = sessionData.session.user.id;
        const { data: profile } = await supabase
          .from('Players')
          .select('onboarding')
          .eq('auth_id', userId)
          .single();
      } else {
        console.log('OAuth cancelled or failed:', result);
      }
    } catch (err) {
      console.error('OAuth error:', err);
    }
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        flex: 1,
        transform: [{ translateX: slideAnim }],
        opacity: fadeAnim,
      }}>
      <SafeViewWrapper bottomColor="bg-bg-grouped-1" topColor="bg-brand">
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
              <View class>
                <Text className="text-3xl font-bold text-text-1">Welcome back!</Text>
                <Text className="text-lg text-text-2">Enter your details to sign in.</Text>
              </View>
              <TextInput
                className="h-16 rounded-xl border border-border-color bg-input-background px-4 pb-1 text-xl text-text-1 placeholder:text-text-3"
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="emailAddress"
                textContentType="emailAddress"
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
                  textContentType="password"
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
                <Link className="text-theme-blue underline" href="/reset-password">
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
};

export default LoginPage;

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
